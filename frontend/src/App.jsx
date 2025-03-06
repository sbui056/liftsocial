import { Box } from "@chakra-ui/react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import CreatePost from "./pages/CreatePost"
import Messages from "./pages/Messages"
import Profile from "./components/Profile"
import Auth from "./components/Auth"
import { supabase } from "./supabase"
import { AuthProvider } from "./contexts/AuthContext"

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <Box minH="100vh" bg="midnight.900" display="flex" alignItems="center" justifyContent="center">
        <Box color="brand.400">Loading...</Box>
      </Box>
    )
  }

  return (
    <AuthProvider>
      <Router>
        <Box minH="100vh" bg="midnight.900">
          {session ? (
            <>
              <Navbar />
              <Box pt="60px">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/create" element={<CreatePost />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </Box>
            </>
          ) : (
            <Routes>
              <Route path="*" element={<Auth />} />
            </Routes>
          )}
        </Box>
      </Router>
    </AuthProvider>
  );
}

export default App
