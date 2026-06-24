import { createContext, useContext, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { fetchHomeContent, saveHomeContent } from '../api/homeContent'

const STORAGE_KEY = 'mcuf_home_content'

const DEFAULT_CONTENT = {
  hero: {
    title: 'Support & Volunteer with Mill Creek Urban Farm',
    subtitle:
      'Find volunteer opportunities, track your impact, and support local food access through active donation campaigns.',
    image: '',
  },
  stats: [
    { value: '15,000+', label: 'Pounds of food grown' },
    { value: '250+', label: 'Volunteers engaged' },
    { value: '500+', label: 'Households supported' },
  ],
  location: {
    address: '4901 Brown St, Philadelphia, PA 19139',
    hours: 'Monday–Friday 9am–5pm',
  },
  footer: {
    contact: '',
    email: 'hello@millcreekurbanfarm.org',
    social: '',
    nonprofit: '© 2025 Mill Creek Urban Farm. All rights reserved.',
  },
  impactStats: {
    compostLbs: 1200,
    basketsProvided: 540,
    annualSustainabilityTarget: 90000,
  },
  happeningNow: {
    volunteerOpportunities: [],
    campaigns: [],
  },
}

function deepMerge(defaults, stored) {
  const result = { ...defaults }
  for (const key of Object.keys(defaults)) {
    if (
      stored[key] !== undefined &&
      typeof stored[key] === 'object' &&
      !Array.isArray(stored[key]) &&
      stored[key] !== null
    ) {
      result[key] = deepMerge(defaults[key], stored[key])
    } else if (stored[key] !== undefined) {
      result[key] = stored[key]
    }
  }
  return result
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONTENT
    return deepMerge(DEFAULT_CONTENT, JSON.parse(raw))
  } catch {
    return DEFAULT_CONTENT
  }
}

const HomeContentContext = createContext(null)

export function HomeContentProvider({ children }) {
  const [content, setContent] = useState(loadFromStorage)
  const [saving, setSaving] = useState(false)
  const hydratedRef = useRef(false)
  const dirtyRef = useRef(false)
  const persistTimerRef = useRef(null)

  const updateContent = (updater) => {
    setSaving(true)
    setContent((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (error) {
        void error
      }
      dirtyRef.current = true
      return next
    })
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const remote = await fetchHomeContent()
        if (!mounted || !remote) return
        const merged = deepMerge(DEFAULT_CONTENT, remote)
        setContent(merged)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        } catch (error) {
          void error
        }
      } catch (error) {
        void error
      }
      hydratedRef.current = true
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return undefined
    if (!dirtyRef.current) return undefined
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    persistTimerRef.current = setTimeout(() => {
      saveHomeContent(content)
        .then(() => {
          dirtyRef.current = false
          setSaving(false)
        })
        .catch((error) => {
          void error
          setSaving(false)
        })
    }, 500)
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    }
  }, [content])

  const resetContent = () => {
    localStorage.removeItem(STORAGE_KEY)
    dirtyRef.current = true
    setContent(DEFAULT_CONTENT)
  }

  return (
    <HomeContentContext.Provider value={{ content, updateContent, resetContent, saving }}>
      {children}
    </HomeContentContext.Provider>
  )
}

export function useHomeContent() {
  const ctx = useContext(HomeContentContext)
  if (!ctx) throw new Error('useHomeContent must be used within HomeContentProvider')
  return ctx
}

HomeContentProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
