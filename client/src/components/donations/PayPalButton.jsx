import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { createDonationOrder, captureDonationOrder } from "../../api/donation"
import { Box, CircularProgress, Alert } from "@mui/material"
import { useState } from "react"

/**
 * PayPal Button Component
 * Real PayPal SDK button for processing donations
 */
export default function PayPalButton({ 
  amount, 
  projectId, 
  message,
  isAnonymous,
  onSuccess, 
  onError,
  disabled,
  createAccount,
  accountData,
  updateAccountInfo,
  email, // Email for autofill in card payment form
}) {
  const [{ isPending }] = usePayPalScriptReducer()
  const [error, setError] = useState(null)

  const createOrder = async (data, actions) => {
    try {
      setError(null)
      const response = await createDonationOrder({
        projectId,
        amount,
        currency: "USD",
        isAnonymous,
        email, // Pass email for autofill
      })
      return response.data.orderId
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to create order"
      setError(errorMessage)
      onError?.(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const onApprove = async (data, actions) => {
    try {
      setError(null)
      const captureData = {
        orderId: data.orderID,
        payerId: data.payerID,
        message: message || null,
      }
      
      // Include account creation data if user wants to create an account
      if (createAccount && accountData) {
        captureData.createAccount = true
        captureData.accountData = accountData
      }
      
      // Include account update data if logged-in user edited their info
      if (updateAccountInfo) {
        captureData.updateAccountInfo = updateAccountInfo
      }
      
      const response = await captureDonationOrder(captureData)
      onSuccess?.(response.data)
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Payment failed"
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }

  const onErrorHandler = (err) => {
    const errorMessage = err.message || "An error occurred with PayPal"
    setError(errorMessage)
    onError?.(errorMessage)
  }

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ marginTop: '24px' }}>
      {error && (
        <Alert severity="error" sx={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onErrorHandler}
        disabled={disabled || isPending}
        style={{
          layout: "vertical",
          color: "gold",
          shape: "pill",
          label: "paypal"
        }}
      />
    </Box>
  )
}
