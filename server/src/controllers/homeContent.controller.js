import HomeContent from 'models/homeContent.model'

const HOME_CONTENT_KEY = 'global'

export const getHomeContent = async (req, res) => {
  try {
    const doc = await HomeContent.findOne({ key: HOME_CONTENT_KEY }).lean()
    return res.status(200).json({ content: doc?.content || null })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load home content' })
  }
}

export const upsertHomeContent = async (req, res) => {
  try {
    const content = req.body?.content
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return res.status(400).json({ error: 'content object is required' })
    }

    const doc = await HomeContent.findOneAndUpdate(
      { key: HOME_CONTENT_KEY },
      { $set: { content } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()

    return res.status(200).json({ content: doc.content })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save home content' })
  }
}
