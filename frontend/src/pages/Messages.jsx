import { useState, useEffect } from "react"
import { 
  Box, 
  Container, 
  VStack, 
  HStack, 
  Input, 
  Button, 
  Text, 
  Avatar,
  Flex,
  useToast,
  useColorModeValue,
  Spinner,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select
} from "@chakra-ui/react"
import { FaPaperPlane, FaUserTie, FaDumbbell, FaPlus } from "react-icons/fa"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"

function RoleBadge({ role }) {
  const isCoach = role === 'coach'
  return (
    <Badge 
      colorScheme={isCoach ? "accent" : "brand"} 
      variant="subtle"
      display="flex"
      alignItems="center"
      gap={1}
    >
      {isCoach ? (
        <>
          <FaUserTie size="12px" />
          Coach
        </>
      ) : (
        <>
          <FaDumbbell size="12px" />
          Lifter
        </>
      )}
    </Badge>
  )
}

function CreateChatRoom({ isOpen, onClose, onChatRoomCreated }) {
  const [selectedUser, setSelectedUser] = useState("")
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)

      if (error) throw error
      setUsers(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error fetching users",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  async function handleCreateChat() {
    if (!selectedUser) {
      toast({
        title: "Please select a user",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      // First, check if a chat room already exists between these users
      const { data: existingRooms, error: checkError } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants (
            user_id
          )
        `)
        .eq('chat_participants.user_id', user.id)
        .eq('chat_participants.user_id', selectedUser)

      if (checkError) throw checkError

      // If a room already exists, use that one
      if (existingRooms && existingRooms.length > 0) {
        onChatRoomCreated(existingRooms[0])
        onClose()
        return
      }

      // Create a new chat room
      const { data: chatRoom, error: chatError } = await supabase
        .from('chat_rooms')
        .insert([{}])
        .select()
        .single()

      if (chatError) throw chatError

      // Add participants
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([
          { room_id: chatRoom.id, user_id: user.id },
          { room_id: chatRoom.id, user_id: selectedUser }
        ])

      if (participantError) throw participantError

      // Fetch the complete chat room data
      const { data: completeRoom, error: fetchError } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants (
            user_id,
            profiles:user_id (
              username,
              avatar_url,
              role
            )
          )
        `)
        .eq('id', chatRoom.id)
        .single()

      if (fetchError) throw fetchError

      toast({
        title: "Chat room created!",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      onChatRoomCreated(completeRoom)
      onClose()
    } catch (error) {
      console.error("Error creating chat room:", error)
      toast({
        title: "Error creating chat room",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg="black.800" borderColor="black.700">
        <ModalHeader color="midnight.100">Create New Chat</ModalHeader>
        <ModalCloseButton color="black.400" />
        <ModalBody pb={6}>
          <FormControl>
            <FormLabel color="midnight.100">Select User</FormLabel>
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              bg="black.900"
              borderColor="black.700"
              color="midnight.100"
              _hover={{ borderColor: "black.600" }}
              _focus={{ borderColor: "brand.400" }}
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </Select>
          </FormControl>
          <Button
            mt={4}
            colorScheme="brand"
            width="100%"
            onClick={handleCreateChat}
            isLoading={loading}
          >
            Create Chat
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

function ChatRoom({ roomId, otherParticipant }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const toast = useToast()
  const { user } = useAuth()

  const bgColor = useColorModeValue('black.800', 'black.800')
  const borderColor = useColorModeValue('black.700', 'black.700')
  const textColor = useColorModeValue('midnight.100', 'midnight.100')

  useEffect(() => {
    // Subscribe to messages in real-time
    const subscription = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Message change received!', payload)
          fetchMessages()
        }
      )
      .subscribe()

    // Initial fetch
    fetchMessages()

    return () => {
      subscription.unsubscribe()
    }
  }, [roomId])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            role
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error fetching messages",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            room_id: roomId,
            content: newMessage,
            user_id: user.id
          }
        ])

      if (error) throw error
      setNewMessage("")
    } catch (error) {
      toast({
        title: "Error sending message",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <VStack h="calc(100vh - 60px)" spacing={0}>
      {/* Chat Header */}
      <Box w="100%" p={4} bg="black.800" borderBottom="1px" borderColor="black.700">
        <HStack spacing={3}>
          <Avatar
            size="sm"
            name={otherParticipant.username}
            src={otherParticipant.avatar_url}
            border="2px"
            borderColor={otherParticipant.role === 'coach' ? 'accent.400' : 'brand.400'}
          />
          <VStack align="start" spacing={0}>
            <HStack>
              <Text fontWeight="bold" color={textColor}>{otherParticipant.username}</Text>
              <RoleBadge role={otherParticipant.role} />
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* Messages List */}
      <Box flex={1} w="100%" overflowY="auto" p={4} bg="black.900">
        <VStack spacing={4} align="stretch">
          {messages.map((message) => (
            <Flex
              key={message.id}
              justify={message.user_id === user.id ? "flex-end" : "flex-start"}
            >
              <Box
                maxW="70%"
                bg={message.user_id === user.id ? "brand.500" : "black.800"}
                color={message.user_id === user.id ? "white" : "midnight.100"}
                p={3}
                borderRadius="lg"
                boxShadow="lg"
                border="1px"
                borderColor={message.user_id === user.id ? "brand.600" : "black.700"}
              >
                <Text fontSize="sm" fontWeight="bold" mb={1}>
                  {message.profiles.username}
                </Text>
                <Text>{message.content}</Text>
                <Text fontSize="xs" color="black.400" mt={1}>
                  {new Date(message.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </Box>
            </Flex>
          ))}
        </VStack>
      </Box>

      {/* Message Input */}
      <Box w="100%" p={4} bg="black.800" borderTop="1px" borderColor="black.700">
        <form onSubmit={sendMessage}>
          <HStack>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              size="lg"
              bg="black.900"
              borderColor="black.700"
              color="midnight.100"
              _hover={{ borderColor: "black.600" }}
              _focus={{ borderColor: "brand.400" }}
            />
            <Button 
              type="submit" 
              colorScheme="brand" 
              size="lg"
              leftIcon={<FaPaperPlane />}
              _hover={{ transform: 'translateY(-2px)' }}
              transition="all 0.2s"
            >
              Send
            </Button>
          </HStack>
        </form>
      </Box>
    </VStack>
  )
}

function Messages() {
  const [chatRooms, setChatRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { user } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const bgColor = useColorModeValue('black.800', 'black.800')
  const borderColor = useColorModeValue('black.700', 'black.700')
  const textColor = useColorModeValue('midnight.100', 'midnight.100')

  useEffect(() => {
    fetchChatRooms()
  }, [])

  async function fetchChatRooms() {
    try {
      // First, get all chat rooms where the user is a participant
      const { data: chatRooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants (
            user_id
          )
        `)
        .eq('chat_participants.user_id', user.id)

      if (roomsError) throw roomsError

      // Get all participants' profiles
      const participantIds = chatRooms
        .flatMap(room => room.chat_participants)
        .map(participant => participant.user_id)

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, role')
        .in('id', participantIds)

      if (profilesError) throw profilesError

      // Create a map of user IDs to profiles
      const profileMap = profiles.reduce((acc, profile) => {
        acc[profile.id] = profile
        return acc
      }, {})

      // Transform the chat rooms data
      const transformedRooms = chatRooms
        .filter(room => room.chat_participants && room.chat_participants.length > 0)
        .map(room => ({
          ...room,
          chat_participants: room.chat_participants.map(participant => ({
            ...participant,
            profiles: profileMap[participant.user_id]
          }))
        }))

      console.log("Fetched chat rooms:", transformedRooms)
      setChatRooms(transformedRooms)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching chat rooms:", error)
      toast({
        title: "Error fetching chat rooms",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // Find the other participant (not the current user)
  const getOtherParticipant = (room) => {
    return room.chat_participants.find(
      participant => participant.user_id !== user.id
    )?.profiles
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" h="200px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" />
            <Text color="black.400">Loading messages...</Text>
          </VStack>
        </Flex>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" h="calc(100vh - 60px)" py={0}>
      <Flex h="100%">
        {/* Chat Rooms Sidebar */}
        <Box w="300px" borderRight="1px" borderColor="black.700" bg="black.800">
          <VStack spacing={0} align="stretch">
            <Button
              leftIcon={<FaPlus />}
              colorScheme="brand"
              onClick={onOpen}
              m={4}
            >
              New Chat
            </Button>
            {chatRooms.length === 0 ? (
              <Text color="black.400" textAlign="center" p={4}>
                No chat rooms yet. Start a new chat!
              </Text>
            ) : (
              chatRooms.map((room) => {
                const otherParticipant = getOtherParticipant(room)
                if (!otherParticipant) return null
                
                return (
                  <Button
                    key={room.id}
                    variant={selectedRoom?.id === room.id ? "solid" : "ghost"}
                    colorScheme={selectedRoom?.id === room.id ? "brand" : "gray"}
                    justifyContent="flex-start"
                    onClick={() => setSelectedRoom(room)}
                    borderRadius={0}
                    h="60px"
                    bg={selectedRoom?.id === room.id ? "black.700" : "transparent"}
                    color={selectedRoom?.id === room.id ? "brand.400" : "black.400"}
                    _hover={{ 
                      bg: "black.700",
                      color: "brand.400"
                    }}
                    transition="all 0.2s"
                  >
                    <HStack spacing={3}>
                      <Avatar
                        size="sm"
                        name={otherParticipant.username}
                        src={otherParticipant.avatar_url}
                        border="2px"
                        borderColor={otherParticipant.role === 'coach' ? 'accent.400' : 'brand.400'}
                      />
                      <VStack align="start" spacing={0}>
                        <Text>{otherParticipant.username}</Text>
                        <RoleBadge role={otherParticipant.role} />
                      </VStack>
                    </HStack>
                  </Button>
                )
              })
            )}
          </VStack>
        </Box>

        {/* Chat Room */}
        <Box flex={1}>
          {selectedRoom ? (
            <ChatRoom 
              roomId={selectedRoom.id} 
              otherParticipant={getOtherParticipant(selectedRoom)}
            />
          ) : (
            <Box p={4} textAlign="center" color="black.400">
              Select a chat room to start messaging
            </Box>
          )}
        </Box>
      </Flex>

      <CreateChatRoom
        isOpen={isOpen}
        onClose={onClose}
        onChatRoomCreated={(newRoom) => {
          setChatRooms(prev => [newRoom, ...prev])
        }}
      />
    </Container>
  )
}

export default Messages 