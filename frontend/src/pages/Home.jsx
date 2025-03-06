import { useState, useEffect } from "react"
import { 
  Box, 
  Container, 
  VStack, 
  Text, 
  Image, 
  Flex, 
  IconButton, 
  Input, 
  useToast, 
  Spinner,
  Avatar,
  Badge,
  useColorModeValue,
  ScaleFade,
  Fade,
  HStack,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  SlideFade,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider
} from "@chakra-ui/react"
import { keyframes } from "@emotion/react"
import { FaHeart, FaComment, FaShare, FaDumbbell, FaUserTie, FaPlusSquare, FaRegHeart, FaRegComment, FaEllipsisH, FaLink, FaTrash, FaTrophy } from "react-icons/fa"
import { Link } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`

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

function Post({ post, onLike, onComment, onShare, onDelete }) {
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure()
  const toast = useToast()
  const { user } = useAuth()
  const isLiked = post?.likes?.includes(user?.id) || false
  const [showComments, setShowComments] = useState(false)
  const isOwner = user?.id === post?.user_id

  if (!post || !post.profiles) {
    console.warn('Post is missing required data:', post)
    return null
  }

  useEffect(() => {
    if (showComments) {
      loadComments()
    }
  }, [showComments])

  const bgColor = useColorModeValue(
    post.is_pr ? 'accent.900' : 'black.800',
    post.is_pr ? 'accent.900' : 'black.800'
  )
  const borderColor = useColorModeValue(
    post.is_pr ? 'accent.700' : 'black.700',
    post.is_pr ? 'accent.700' : 'black.700'
  )
  const textColor = useColorModeValue('midnight.100', 'midnight.100')

  async function loadComments() {
    setIsLoadingComments(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            role
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      console.log("Loaded comments for post:", post.id, data)
      setComments(data || [])
    } catch (error) {
      console.error("Error loading comments:", error)
      toast({
        title: "Error loading comments",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoadingComments(false)
    }
  }

  async function handleComment(e) {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url, role')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: post.id,
            user_id: user.id,
            text: comment,
            username: profileData.username
          }
        ])
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            role
          )
        `)

      if (error) throw error

      setComments(prev => [...prev, data[0]])
      setComment("")
      toast({
        title: "Comment added!",
        status: "success",
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error adding comment",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleShare = () => {
    const url = window.location.origin + `/post/${post.id}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied!",
      status: "success",
      duration: 2000,
      isClosable: true,
    })
    onShareClose()
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)

      if (error) throw error

      onDelete(post.id)
      
      toast({
        title: "Post deleted",
        status: "success",
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error deleting post",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <ScaleFade in={true} initialScale={0.95}>
      <Box
        bg={bgColor}
        borderRadius="xl"
        overflow="visible"
        boxShadow="xl"
        border="1px"
        borderColor={borderColor}
      >
        {/* Post Header */}
        <HStack p={4} justify="space-between">
          <HStack spacing={3}>
            <Avatar
              size="sm"
              name={post.profiles.username}
              src={post.profiles.avatar_url}
              border="2px"
              borderColor={post.profiles.role === 'coach' ? 'accent.400' : 'brand.400'}
            />
            <VStack align="start" spacing={0}>
              <HStack>
                <Text fontWeight="bold" color={textColor}>{post.profiles.username}</Text>
                <RoleBadge role={post.profiles.role} />
                {post.is_pr && (
                  <Badge 
                    colorScheme="accent" 
                    variant="solid"
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <FaTrophy size="12px" />
                    PR
                  </Badge>
                )}
              </HStack>
              <Text fontSize="xs" color="black.400">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </VStack>
          </HStack>
          {isOwner && (
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaEllipsisH />}
                variant="ghost"
                color="black.400"
                _hover={{ color: textColor }}
              />
              <MenuList bg={bgColor} borderColor={borderColor}>
                <MenuItem 
                  color="red.400" 
                  onClick={handleDelete}
                  _hover={{ bg: 'black.700' }}
                >
                  <HStack>
                    <FaTrash />
                    <Text>Delete Post</Text>
                  </HStack>
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </HStack>

        {/* Post Image/Video */}
        <Box position="relative" paddingTop="100%">
          {post.media_type === 'video' ? (
            <Box
              position="absolute"
              top={0}
              left={0}
              w="100%"
              h="100%"
              zIndex={30}
              backgroundColor="black"
            >
              <Box
                as="video"
                src={post.image_url}
                controls
                autoPlay
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'black',
                }}
              />
            </Box>
          ) : (
            <Image
              src={post.image_url}
              alt={post.caption || 'Post image'}
              objectFit="cover"
              position="absolute"
              top={0}
              left={0}
              w="100%"
              h="100%"
            />
          )}
        </Box>

        {/* Post Actions and Content */}
        <Box p={4}>
          {/* Post Actions */}
          <HStack spacing={4} mb={4}>
            <IconButton
              icon={isLiked ? <FaHeart /> : <FaRegHeart />}
              aria-label="Like"
              variant="ghost"
              colorScheme={isLiked ? "red" : "gray"}
              onClick={() => onLike(post.id)}
              _hover={{ transform: 'scale(1.1)' }}
              transition="all 0.2s"
            />
            <IconButton
              icon={showComments ? <FaComment /> : <FaRegComment />}
              aria-label="Comment"
              variant="ghost"
              colorScheme="gray"
              onClick={() => setShowComments(!showComments)}
              _hover={{ transform: 'scale(1.1)' }}
              transition="all 0.2s"
            />
            <Menu isOpen={isShareOpen} onClose={onShareClose}>
              <MenuButton
                as={IconButton}
                icon={<FaShare />}
                aria-label="Share"
                variant="ghost"
                colorScheme="gray"
                onClick={onShareOpen}
                _hover={{ transform: 'scale(1.1)' }}
                transition="all 0.2s"
              />
              <MenuList bg={bgColor} borderColor={borderColor}>
                <MenuItem 
                  color={textColor} 
                  onClick={handleShare}
                  bg={bgColor}
                  _hover={{ bg: 'black.700' }}
                >
                  <HStack>
                    <FaLink />
                    <Text>Copy Link</Text>
                  </HStack>
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>

          {/* Likes Count */}
          <Text fontWeight="bold" mb={2} color={textColor}>
            {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
          </Text>

          {/* Caption */}
          {post.caption && (
            <Text mb={4} color={textColor}>
              <Text as="span" fontWeight="bold">{post.profiles.username}</Text> {post.caption}
            </Text>
          )}

          {/* Comments Count and Toggle */}
          <Button
            variant="ghost"
            size="sm"
            color="black.400"
            onClick={() => setShowComments(!showComments)}
            mb={4}
            _hover={{ color: textColor }}
          >
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </Button>

          {/* Comments Section */}
          {showComments && (
            <VStack align="stretch" spacing={4}>
              <Divider borderColor={borderColor} />
              
              {/* Comments List */}
              <Box maxH="400px" overflowY="auto" css={{
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  width: '6px',
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'var(--chakra-colors-black-700)',
                  borderRadius: '24px',
                },
              }}>
                <VStack align="stretch" spacing={4}>
                  {isLoadingComments ? (
                    <Text color="black.400">Loading comments...</Text>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      comment && comment.profiles ? (
                        <Box key={comment.id}>
                          <HStack spacing={3} align="start">
                            <Avatar
                              size="sm"
                              name={comment.profiles.username}
                              src={comment.profiles.avatar_url}
                              border="2px"
                              borderColor={comment.profiles.role === 'coach' ? 'accent.400' : 'brand.400'}
                            />
                            <VStack align="start" spacing={0}>
                              <HStack>
                                <Text fontWeight="bold" color={textColor}>{comment.profiles.username}</Text>
                                <RoleBadge role={comment.profiles.role} />
                              </HStack>
                              <Text color={textColor}>{comment.text}</Text>
                              <Text fontSize="xs" color="black.400">
                                {new Date(comment.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      ) : null
                    ))
                  ) : (
                    <Text color="black.400">No comments yet</Text>
                  )}
                </VStack>
              </Box>

              {/* Comment Input */}
              <form onSubmit={handleComment}>
                <HStack>
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    size="sm"
                    bg="black.900"
                    borderColor="black.700"
                    color={textColor}
                    _hover={{ borderColor: "black.600" }}
                    _focus={{ borderColor: "brand.400" }}
                  />
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="sm"
                    isDisabled={!comment.trim()}
                  >
                    Post
                  </Button>
                </HStack>
              </form>
            </VStack>
          )}
        </Box>
      </Box>
    </ScaleFade>
  )
}

function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const toast = useToast()

  useEffect(() => {
    console.log("Setting up posts subscription...")
    try {
      const subscription = supabase
        .channel('posts')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts'
          },
          (payload) => {
            console.log('Change received!', payload)
            fetchPosts()
          }
        )
        .subscribe()

      fetchPosts()

      return () => {
        console.log("Cleaning up posts subscription...")
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("Error setting up posts subscription:", error)
      setError(error.message)
      toast({
        title: "Error setting up posts subscription",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            role
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log("Fetched posts:", data)
      setPosts(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching posts:", error)
      setError(error.message)
      toast({
        title: "Error fetching posts",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleLike = async (postId) => {
    if (!user) {
      toast({
        title: "Please sign in to like posts",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const post = posts.find(p => p.id === postId)
      const newLikes = post.likes || []
      const isLiked = newLikes.includes(user.id)
      
      const updatedLikes = isLiked 
        ? newLikes.filter(id => id !== user.id)
        : [...newLikes, user.id]

      const { error } = await supabase
        .from('posts')
        .update({ likes: updatedLikes })
        .eq('id', postId)

      if (error) throw error

      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, likes: updatedLikes }
          : p
      ))

      toast({
        title: isLiked ? "Post unliked" : "Post liked!",
        status: "success",
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error("Error liking post:", error)
      toast({
        title: "Error updating like",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleDelete = async (postId) => {
    setPosts(posts.filter(p => p.id !== postId))
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" h="200px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" />
            <Text color="black.400">Loading posts...</Text>
            {error && <Text color="red.500">Error: {error}</Text>}
          </VStack>
        </Flex>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="center">
        {posts.length === 0 ? (
          <Fade in={true}>
            <VStack spacing={6} textAlign="center" py={12}>
              <Box
                p={6}
                borderRadius="full"
                bg="black.800"
                border="2px"
                borderColor="black.700"
                boxShadow="lg"
              >
                <FaDumbbell size="48px" color="var(--chakra-colors-brand-400)" />
              </Box>
              <VStack spacing={2}>
                <Text fontSize="xl" fontWeight="bold" color="midnight.100">
                  No Posts Yet
                </Text>
                <Text color="black.400" maxW="sm">
                  Be the first to share your fitness journey! Create a post to inspire others.
                </Text>
              </VStack>
              <Button
                as={Link}
                to="/create"
                colorScheme="brand"
                leftIcon={<FaPlusSquare />}
                size="lg"
                mt={4}
                _hover={{ transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                Create Your First Post
              </Button>
            </VStack>
          </Fade>
        ) : (
          posts.map(post => (
            <Box key={post.id} w="100%" maxW="600px">
              <Post 
                post={post}
                onLike={handleLike}
                onComment={handleLike}
                onShare={handleLike}
                onDelete={handleDelete}
              />
            </Box>
          ))
        )}
      </VStack>
    </Container>
  );
}

export default Home; 