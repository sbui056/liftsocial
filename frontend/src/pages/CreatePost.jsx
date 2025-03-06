import { useState, useRef, useEffect } from "react"
import { 
  Box, 
  Container, 
  VStack, 
  Button, 
  Textarea, 
  Text, 
  useToast, 
  Image,
  IconButton,
  Heading,
  useColorModeValue,
  ScaleFade,
  Fade,
  SlideFade,
  HStack,
  Select,
  Switch,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from "@chakra-ui/react"
import { FaCamera, FaTimes, FaPaperPlane, FaVideo, FaImage } from "react-icons/fa"
import { supabase } from "../supabase"
import { useNavigate } from "react-router-dom"

function CreatePost() {
  const [caption, setCaption] = useState("")
  const [media, setMedia] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [mediaType, setMediaType] = useState("image") // "image" or "video"
  const [isPR, setIsPR] = useState(false)
  const [liftType, setLiftType] = useState("squat")
  const [weight, setWeight] = useState(0)
  const fileInputRef = useRef(null)
  const toast = useToast()
  const navigate = useNavigate()

  const bgColor = useColorModeValue('black.800', 'black.800')
  const borderColor = useColorModeValue('black.700', 'black.700')
  const hoverBorderColor = useColorModeValue('black.600', 'black.600')

  useEffect(() => {
    getUserProfile()
  }, [])

  async function getUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error("Error loading profile:", error)
      toast({
        title: "Error loading profile",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleMediaSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (mediaType === "image") {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit for images
          toast({
            title: "File too large",
            description: "Please select an image under 5MB",
            status: "error",
            duration: 3000,
            isClosable: true,
          })
          return
        }
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please select an image file",
            status: "error",
            duration: 3000,
            isClosable: true,
          })
          return
        }
      } else {
        if (file.size > 50 * 1024 * 1024) { // 50MB limit for videos
          toast({
            title: "File too large",
            description: "Please select a video under 50MB",
            status: "error",
            duration: 3000,
            isClosable: true,
          })
          return
        }
        if (!file.type.startsWith('video/')) {
          toast({
            title: "Invalid file type",
            description: "Please select a video file",
            status: "error",
            duration: 3000,
            isClosable: true,
          })
          return
        }
      }

      setMedia(file)
      // Create a blob URL for video preview
      const previewUrl = URL.createObjectURL(file)
      setMediaPreview(previewUrl)
      setError(null)
    }
  }

  const removeMedia = () => {
    setMedia(null)
    if (mediaPreview) {
      // Clean up the blob URL when removing media
      URL.revokeObjectURL(mediaPreview)
    }
    setMediaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!media) {
      toast({
        title: "No media selected",
        description: "Please select an image or video to post",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (isPR && weight <= 0) {
      toast({
        title: "Invalid weight",
        description: "Please enter a valid weight for your PR",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!userProfile) {
      toast({
        title: "Profile not found",
        description: "Please complete your profile first",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsUploading(true)
    setError(null)
    
    try {
      console.log("Starting upload process...")
      
      // Create a unique filename with proper extension
      const timestamp = Date.now()
      const fileExtension = media.name.split('.').pop()
      const filename = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`
      
      // Upload media to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filename, media, {
          contentType: media.type,
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) throw uploadError
      console.log("Upload completed:", uploadData)
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filename)
      
      console.log("Media URL:", publicUrl)

      // Create post in Supabase
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            image_url: publicUrl,
            caption,
            user_id: userProfile.id,
            username: userProfile.username,
            likes: [],
            is_pr: isPR,
            lift_type: isPR ? liftType : null,
            media_type: mediaType // Add media type to the post
          }
        ])
        .select()
      
      if (postError) {
        console.error("Post creation error:", postError)
        throw postError
      }
      console.log("Post created:", postData)

      // If this is a PR, create a personal record entry
      if (isPR && liftType && weight > 0) {
        console.log("Creating PR entry with:", { liftType, weight })
        const { error: prError } = await supabase
          .from('personal_records')
          .insert([
            {
              user_id: userProfile.id,
              lift_type: liftType,
              weight: weight,
              post_id: postData[0].id
            }
          ])

        if (prError) {
          console.error("PR creation error:", prError)
          throw prError
        }
      }

      // Reset form
      setCaption("")
      removeMedia()
      setIsPR(false)
      setLiftType("squat")
      setWeight(0)
      
      toast({
        title: "Post created!",
        description: "Your post has been created successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Navigate to home page
      navigate("/")
    } catch (error) {
      console.error("Error creating post:", error)
      setError(error.message)
      toast({
        title: "Error creating post",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Container maxW="container.md" py={8}>
      <ScaleFade in={true} initialScale={0.9}>
        <VStack spacing={8} as="form" onSubmit={handleSubmit}>
          <Heading 
            size="xl" 
            bgGradient="linear(to-r, brand.400, accent.400)"
            bgClip="text"
            textAlign="center"
          >
            Create New Post
          </Heading>

          {/* Media Type Selector */}
          <HStack spacing={4} w="100%">
            <Select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              bg="black.900"
              borderColor="black.700"
              color="midnight.100"
              _hover={{ borderColor: "black.600" }}
              _focus={{ borderColor: "brand.400" }}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </Select>
          </HStack>
          
          {/* PR Toggle and Details */}
          <FormControl display="flex" flexDirection="column" gap={4} w="100%">
            <HStack justify="space-between">
              <FormLabel mb="0" color="midnight.100">
                This is a Personal Record (PR)
              </FormLabel>
              <Switch
                isChecked={isPR}
                onChange={(e) => setIsPR(e.target.checked)}
                colorScheme="accent"
              />
            </HStack>

            {isPR && (
              <VStack spacing={4} w="100%">
                <Select
                  value={liftType}
                  onChange={(e) => {
                    console.log("Lift type changed to:", e.target.value)
                    setLiftType(e.target.value)
                  }}
                  bg="black.900"
                  borderColor="black.700"
                  color="midnight.100"
                  _hover={{ borderColor: "black.600" }}
                  _focus={{ borderColor: "brand.400" }}
                >
                  <option value="squat">Squat</option>
                  <option value="bench">Bench Press</option>
                  <option value="deadlift">Deadlift</option>
                </Select>

                <FormControl>
                  <FormLabel color="midnight.100">Weight (lbs)</FormLabel>
                  <NumberInput
                    value={weight}
                    onChange={(value) => setWeight(parseFloat(value))}
                    min={0}
                    step={5}
                    bg="black.900"
                    borderColor="black.700"
                    color="midnight.100"
                    _hover={{ borderColor: "black.600" }}
                    _focus={{ borderColor: "brand.400" }}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </VStack>
            )}
          </FormControl>

          {/* Media Upload Area */}
          <SlideFade in={true} offsetY="20px">
            <Box
              w="100%"
              maxW="600px"
              maxH="400px"
              border="2px dashed"
              borderColor={borderColor}
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ 
                borderColor: hoverBorderColor,
                transform: 'scale(1.02)',
                boxShadow: 'lg'
              }}
              position="relative"
              overflow="hidden"
              bg={bgColor}
            >
              {mediaPreview ? (
                <Fade in={true}>
                  <Box position="relative" w="100%" h="100%">
                    {mediaType === "image" ? (
                      <Image
                        src={mediaPreview}
                        alt="Preview"
                        objectFit="contain"
                        width="100%"
                        height="100%"
                        transition="transform 0.2s"
                        _hover={{ transform: 'scale(1.05)' }}
                      />
                    ) : (
                      <Box
                        as="video"
                        src={mediaPreview}
                        controls
                        width="100%"
                        height="100%"
                        objectFit="contain"
                        autoPlay
                        muted
                        sx={{
                          '&::-webkit-media-controls-panel': {
                            backgroundColor: 'black.800',
                            borderRadius: 'md',
                          },
                          '&::-webkit-media-controls-play-button': {
                            backgroundColor: 'brand.400',
                            borderRadius: '50%',
                          },
                          '&::-webkit-media-controls-timeline': {
                            backgroundColor: 'black.700',
                            borderRadius: 'md',
                          },
                          '&::-webkit-media-controls-current-time-display': {
                            color: 'midnight.100',
                          },
                          '&::-webkit-media-controls-time-remaining-display': {
                            color: 'midnight.100',
                          },
                        }}
                      />
                    )}
                    <IconButton
                      aria-label="Remove media"
                      icon={<FaTimes />}
                      position="absolute"
                      top={4}
                      right={4}
                      colorScheme="red"
                      onClick={removeMedia}
                      size="sm"
                      borderRadius="full"
                      opacity={0.8}
                      _hover={{ opacity: 1 }}
                    />
                  </Box>
                </Fade>
              ) : (
                <VStack spacing={4}>
                  {mediaType === "image" ? (
                    <FaImage size="32px" color="var(--chakra-colors-brand-400)" />
                  ) : (
                    <FaVideo size="32px" color="var(--chakra-colors-brand-400)" />
                  )}
                  <Text color="black.400" fontSize="lg">
                    Click to upload {mediaType}
                  </Text>
                  <input
                    type="file"
                    accept={mediaType === "image" ? "image/*" : "video/*"}
                    onChange={handleMediaSelect}
                    style={{ display: "none" }}
                    ref={fileInputRef}
                  />
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={mediaType === "image" ? <FaImage /> : <FaVideo />}
                    colorScheme="brand"
                    _hover={{ transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                    borderColor="black.700"
                    color="midnight.100"
                  >
                    Select {mediaType === "image" ? "Image" : "Video"}
                  </Button>
                </VStack>
              )}
            </Box>
          </SlideFade>

          {/* Caption Input */}
          <SlideFade in={true} offsetY="20px" delay={0.2}>
            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              size="lg"
              rows={4}
              borderRadius="xl"
              borderColor={borderColor}
              _hover={{ borderColor: hoverBorderColor }}
              _focus={{ borderColor: 'brand.400' }}
              resize="none"
              bg="black.900"
              color="midnight.100"
            />
          </SlideFade>

          {/* Error Message */}
          {error && (
            <Fade in={true}>
              <Text color="red.500" textAlign="center" fontSize="sm">
                Error: {error}
              </Text>
            </Fade>
          )}

          {/* Submit Button */}
          <SlideFade in={true} offsetY="20px" delay={0.4}>
            <Button
              type="submit"
              colorScheme="brand"
              width="100%"
              size="lg"
              isLoading={isUploading}
              loadingText="Creating post..."
              leftIcon={<FaPaperPlane />}
              _hover={{ transform: 'translateY(-2px)' }}
              transition="all 0.2s"
            >
              Create Post
            </Button>
          </SlideFade>
        </VStack>
      </ScaleFade>
    </Container>
  );
}

export default CreatePost; 