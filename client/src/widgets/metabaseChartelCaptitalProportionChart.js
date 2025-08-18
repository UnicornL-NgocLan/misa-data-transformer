import React, { useEffect, useState } from 'react'
import app from '../axiosConfig'

const MetabaseChartelCaptitalProportionChart = () => {
  const [url, setUrl] = useState('')

  const handleFetchMetbaseUrl = async () => {
    try {
      const { data } = await app.get('/api/get-chartel-captial-proportion-link')
      setUrl(data.link)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }
  useEffect(() => {
    handleFetchMetbaseUrl()
  }, [])
  return (
    <div>
      {url && <iframe src={url} style={{ width: '100%', height: 600 }} />}
    </div>
  )
}

export default MetabaseChartelCaptitalProportionChart
