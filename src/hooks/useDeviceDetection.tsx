import * as React from "react"

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  userAgent: string
  screenWidth: number
  screenHeight: number
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        userAgent: '',
        screenWidth: 1024,
        screenHeight: 768
      }
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Mobile detection
    const isMobile = screenWidth < 768 || /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    
    // Tablet detection
    const isTablet = !isMobile && (screenWidth >= 768 && screenWidth < 1024) || 
      /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
    
    // Desktop detection
    const isDesktop = !isMobile && !isTablet

    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      userAgent,
      screenWidth,
      screenHeight
    }
  })

  React.useEffect(() => {
    const updateDeviceInfo = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      
      const isMobile = screenWidth < 768 || /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      const isTablet = !isMobile && (screenWidth >= 768 && screenWidth < 1024) || 
        /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
      const isDesktop = !isMobile && !isTablet

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        userAgent,
        screenWidth,
        screenHeight
      })
    }

    updateDeviceInfo()
    
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}