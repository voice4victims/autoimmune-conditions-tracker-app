"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { ThemeProviderProps } from "next-themes/dist/types"
import { setSecureItem, getSecureItem } from "@/lib/encryption";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type Theme = "dark" | "light" | "system"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  value: _value,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = getSecureItem<Theme>("theme");
      return (savedTheme && ["dark", "light", "system"].includes(savedTheme)
        ? savedTheme
        : defaultTheme) as Theme
    }
    return defaultTheme as Theme
  })

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const skipFirestoreSync = useRef(false);

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (!isAuthenticated) {
      root.classList.add("light")
      return
    }

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme, isAuthenticated])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      if (!user || user.isAnonymous) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const savedTheme = userDoc.data()?.theme;
        if (savedTheme && ["dark", "light", "system"].includes(savedTheme)) {
          skipFirestoreSync.current = true;
          setSecureItem("theme", savedTheme);
          setThemeState(savedTheme as Theme);
        }
      } catch {}
    });
    return () => unsubscribe();
  }, []);

  const setTheme = (newTheme: Theme) => {
    setSecureItem("theme", newTheme);
    setThemeState(newTheme);

    if (skipFirestoreSync.current) {
      skipFirestoreSync.current = false;
      return;
    }

    const user = auth.currentUser;
    if (user && !user.isAnonymous) {
      setDoc(doc(db, "users", user.uid), { theme: newTheme }, { merge: true }).catch(() => {});
    }
  };

  const value: ThemeContextType = { theme, setTheme }

  return (
    <ThemeContext.Provider value={value} {...props}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
