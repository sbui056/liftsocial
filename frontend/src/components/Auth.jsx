import { useState } from "react"
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Heading,
  ScaleFade,
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from "@chakra-ui/react"
import { supabase } from "../supabase"

function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const toast = useToast()

  const handleSignUp = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        if (error.message.includes("already registered")) {
          setError("An account with this email already exists. Please sign in instead.")
        } else {
          throw error
        }
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
          status: "success",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      setError(error.message)
      toast({
        title: "Error signing up",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      toast({
        title: "Signed in successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      setError(error.message)
      toast({
        title: "Error signing in",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="container.sm" py={8}>
      <ScaleFade in={true} initialScale={0.95}>
        <VStack spacing={8} as="form">
          <Heading 
            size="xl" 
            bgGradient="linear(to-r, brand.400, accent.400)"
            bgClip="text"
            textAlign="center"
          >
            Welcome to LiftSocial
          </Heading>
          
          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              variant="filled"
              bg="black.900"
              _hover={{ bg: "black.800" }}
              _focus={{ bg: "black.900" }}
              border="none"
              color="midnight.100"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              variant="filled"
              bg="black.900"
              _hover={{ bg: "black.800" }}
              _focus={{ bg: "black.900" }}
              border="none"
              color="midnight.100"
            />
          </FormControl>

          <VStack spacing={4} width="100%">
            <Button
              onClick={handleSignIn}
              colorScheme="brand"
              width="100%"
              isLoading={loading}
              loadingText="Signing in..."
            >
              Sign In
            </Button>
            <Button
              onClick={handleSignUp}
              colorScheme="accent"
              width="100%"
              isLoading={loading}
              loadingText="Signing up..."
            >
              Sign Up
            </Button>
          </VStack>
        </VStack>
      </ScaleFade>
    </Container>
  )
}

export default Auth 