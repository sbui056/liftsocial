import { useState, useEffect, useRef } from "react"
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  useToast,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Input,
  Icon,
  ScaleFade,
  Fade,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  useColorModeValue,
  IconButton,
  Image,
  Badge,
  Heading,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Textarea
} from "@chakra-ui/react"
import { FaDumbbell, FaUserTie, FaCamera, FaSave, FaTimes, FaTrophy, FaWeightHanging, FaChartLine, FaEdit } from "react-icons/fa"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

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

function PRChart({ prs, liftType }) {
  const data = {
    labels: prs.map(pr => new Date(pr.created_at).toLocaleDateString()),
    datasets: [
      {
        label: `${liftType.charAt(0).toUpperCase() + liftType.slice(1)} PR History`,
        data: prs.map(pr => pr.weight),
        borderColor: 'rgb(147, 51, 234)', // accent.500
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#94a3b8', // black.400
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#94a3b8', // black.400
        },
      },
    },
  }

  return (
    <Box
      bg="black.900"
      borderRadius="lg"
      p={4}
      border="1px"
      borderColor="black.700"
      h="300px"
    >
      <Line data={data} options={options} />
    </Box>
  )
}

function Profile() {
  const [username, setUsername] = useState("")
  const [role, setRole] = useState("lifter")
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [prs, setPrs] = useState({
    squat: [],
    bench: [],
    deadlift: []
  })
  const [profile, setProfile] = useState(null)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bio, setBio] = useState("")
  const [isUpdatingBio, setIsUpdatingBio] = useState(false)
  const { user } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef(null)

  const bgColor = useColorModeValue('black.800', 'black.800')
  const borderColor = useColorModeValue('black.700', 'black.700')
  const textColor = useColorModeValue('midnight.100', 'midnight.100')

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchPRs()
    }
  }, [user])

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
      setBio(data.bio || "")
      setUsername(data.username)
      setRole(data.role)
      setAvatarUrl(data.avatar_url)
    } catch (error) {
      console.error("Error loading profile:", error)
      setError(error.message)
      toast({
        title: "Error loading profile",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchPRs() {
    try {
      const { data, error } = await supabase
        .from('personal_records')
        .select(`
          *,
          posts (
            image_url,
            caption,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Organize PRs by lift type
      const organizedPRs = {
        squat: [],
        bench: [],
        deadlift: []
      }

      data.forEach(pr => {
        organizedPRs[pr.lift_type].push(pr)
      })

      setPrs(organizedPRs)
    } catch (error) {
      console.error("Error fetching PRs:", error)
      toast({
        title: "Error fetching PRs",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      let avatarUrlToUpdate = avatarUrl

      if (avatarFile) {
        // Upload new avatar
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}/${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrlToUpdate = publicUrl
      }

      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw fetchError
      }

      const profileData = {
        id: user.id,
        username,
        role,
        avatar_url: avatarUrlToUpdate,
        updated_at: new Date().toISOString()
      }

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id)
      } else {
        // Create new profile
        result = await supabase
          .from('profiles')
          .insert([profileData])
      }

      if (result.error) throw result.error

      // Refresh profile data
      await fetchProfile()

      toast({
        title: "Profile updated!",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      setError(error.message)
      toast({
        title: "Error updating profile",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setSaving(false)
    }
  }

  async function updateBio() {
    if (!profile) return

    setIsUpdatingBio(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio })
        .eq('id', profile.id)

      if (error) throw error

      setProfile(prev => ({ ...prev, bio }))
      setIsEditingBio(false)
      toast({
        title: "Bio updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error("Error updating bio:", error)
      toast({
        title: "Error updating bio",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsUpdatingBio(false)
    }
  }

  if (loading) {
    return (
      <Container maxW="container.md" py={8}>
        <Flex justify="center" align="center" h="200px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" />
            <Text color="black.400">Loading profile...</Text>
          </VStack>
        </Flex>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Profile Header */}
        <Box
          bg="black.800"
          borderRadius="xl"
          p={6}
          boxShadow="xl"
          border="1px"
          borderColor="black.700"
        >
          <HStack spacing={6}>
            <Avatar
              size="xl"
              name={profile?.username}
              src={avatarPreview || avatarUrl || "https://via.placeholder.com/150"}
              border="2px"
              borderColor={profile?.role === 'coach' ? 'accent.400' : 'brand.400'}
            />
            <VStack align="start" spacing={2} flex={1}>
              <HStack>
                <Heading size="lg" color="midnight.100">{profile?.username}</Heading>
                <RoleBadge role={profile?.role} />
              </HStack>
              
              {/* Bio Section */}
              <Box w="100%">
                {isEditingBio ? (
                  <VStack spacing={2} align="stretch">
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      size="sm"
                      rows={3}
                      bg="black.900"
                      borderColor="black.700"
                      color="midnight.100"
                      _hover={{ borderColor: "black.600" }}
                      _focus={{ borderColor: "brand.400" }}
                    />
                    <HStack>
                      <Button
                        size="sm"
                        colorScheme="brand"
                        onClick={updateBio}
                        isLoading={isUpdatingBio}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingBio(false)
                          setBio(profile?.bio || "")
                        }}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  </VStack>
                ) : (
                  <HStack spacing={2} align="start">
                    <Text color="midnight.100" flex={1}>
                      {profile?.bio || "No bio added."}
                    </Text>
                    <IconButton
                      icon={<FaEdit />}
                      aria-label="Edit bio"
                      size="sm"
                      variant="ghost"
                      color="black.400"
                      onClick={() => setIsEditingBio(true)}
                      _hover={{ color: "brand.400" }}
                    />
                  </HStack>
                )}
              </Box>
            </VStack>
          </HStack>
        </Box>

        {/* PRs Section */}
        <Box
          bg="black.800"
          borderRadius="xl"
          p={6}
          boxShadow="xl"
          border="1px"
          borderColor="black.700"
        >
          <VStack spacing={6} align="stretch">
            <HStack>
              <Icon as={FaTrophy} color="accent.400" />
              <Heading size="md" color="midnight.100">Personal Records</Heading>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              {/* Squat PRs */}
              <Box
                bg="black.900"
                borderRadius="lg"
                p={4}
                border="1px"
                borderColor="black.700"
              >
                <Stat>
                  <StatLabel color="midnight.100">Squat</StatLabel>
                  <StatNumber color="accent.400">
                    {prs.squat[0]?.weight || 0} lbs
                  </StatNumber>
                  <StatHelpText color="black.400">
                    {prs.squat.length} PR{prs.squat.length !== 1 ? 's' : ''}
                  </StatHelpText>
                </Stat>
                {prs.squat.length > 0 && (
                  <VStack align="start" mt={4} spacing={2}>
                    {prs.squat.map((pr, index) => (
                      <Text key={pr.id} color="black.400" fontSize="sm">
                        {pr.weight} lbs - {new Date(pr.created_at).toLocaleDateString()}
                      </Text>
                    ))}
                  </VStack>
                )}
              </Box>

              {/* Bench PRs */}
              <Box
                bg="black.900"
                borderRadius="lg"
                p={4}
                border="1px"
                borderColor="black.700"
              >
                <Stat>
                  <StatLabel color="midnight.100">Bench Press</StatLabel>
                  <StatNumber color="accent.400">
                    {prs.bench[0]?.weight || 0} lbs
                  </StatNumber>
                  <StatHelpText color="black.400">
                    {prs.bench.length} PR{prs.bench.length !== 1 ? 's' : ''}
                  </StatHelpText>
                </Stat>
                {prs.bench.length > 0 && (
                  <VStack align="start" mt={4} spacing={2}>
                    {prs.bench.map((pr, index) => (
                      <Text key={pr.id} color="black.400" fontSize="sm">
                        {pr.weight} lbs - {new Date(pr.created_at).toLocaleDateString()}
                      </Text>
                    ))}
                  </VStack>
                )}
              </Box>

              {/* Deadlift PRs */}
              <Box
                bg="black.900"
                borderRadius="lg"
                p={4}
                border="1px"
                borderColor="black.700"
              >
                <Stat>
                  <StatLabel color="midnight.100">Deadlift</StatLabel>
                  <StatNumber color="accent.400">
                    {prs.deadlift[0]?.weight || 0} lbs
                  </StatNumber>
                  <StatHelpText color="black.400">
                    {prs.deadlift.length} PR{prs.deadlift.length !== 1 ? 's' : ''}
                  </StatHelpText>
                </Stat>
                {prs.deadlift.length > 0 && (
                  <VStack align="start" mt={4} spacing={2}>
                    {prs.deadlift.map((pr, index) => (
                      <Text key={pr.id} color="black.400" fontSize="sm">
                        {pr.weight} lbs - {new Date(pr.created_at).toLocaleDateString()}
                      </Text>
                    ))}
                  </VStack>
                )}
              </Box>
            </SimpleGrid>

            {/* PR History Graph */}
            <Box mt={6}>
              <HStack mb={4}>
                <Icon as={FaChartLine} color="accent.400" />
                <Heading size="md" color="midnight.100">PR History</Heading>
              </HStack>
              
              <Tabs variant="enclosed" colorScheme="accent">
                <TabList>
                  <Tab>Squat</Tab>
                  <Tab>Bench Press</Tab>
                  <Tab>Deadlift</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <PRChart prs={prs.squat} liftType="squat" />
                  </TabPanel>
                  <TabPanel>
                    <PRChart prs={prs.bench} liftType="bench" />
                  </TabPanel>
                  <TabPanel>
                    <PRChart prs={prs.deadlift} liftType="deadlift" />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </VStack>
        </Box>

        <ScaleFade in={true} initialScale={0.9}>
          <VStack spacing={8} as="form" onSubmit={updateProfile}>
            <Text fontSize="2xl" fontWeight="bold" color="brand.400">
              Profile Settings
            </Text>

            {error && (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Avatar Upload */}
            <Box position="relative" w="150px" h="150px">
              <Avatar
                size="full"
                src={avatarPreview || avatarUrl || "https://via.placeholder.com/150"}
                name={profile?.username}
                border="4px"
                borderColor={profile?.role === 'coach' ? 'accent.400' : 'brand.400'}
                boxShadow="lg"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
                ref={fileInputRef}
              />
              <IconButton
                aria-label="Change avatar"
                icon={<FaCamera />}
                position="absolute"
                bottom={0}
                right={0}
                colorScheme="brand"
                size="sm"
                borderRadius="full"
                onClick={() => fileInputRef.current?.click()}
              />
              {avatarPreview && (
                <IconButton
                  aria-label="Remove avatar"
                  icon={<FaTimes />}
                  position="absolute"
                  top={0}
                  right={0}
                  colorScheme="red"
                  size="sm"
                  borderRadius="full"
                  onClick={removeAvatar}
                />
              )}
            </Box>

            {/* Username Input */}
            <FormControl isRequired>
              <FormLabel>Username</FormLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                size="lg"
                bg="black.900"
                borderColor="black.700"
                color="midnight.100"
                _hover={{ borderColor: "black.600" }}
                _focus={{ borderColor: "brand.400" }}
              />
            </FormControl>

            {/* Role Selection */}
            <FormControl isRequired>
              <FormLabel>Role</FormLabel>
              <RadioGroup value={role} onChange={setRole}>
                <VStack spacing={4} align="stretch">
                  <Radio value="lifter" colorScheme="brand">
                    <HStack>
                      <FaDumbbell />
                      <Text>Lifter</Text>
                    </HStack>
                  </Radio>
                  <Radio value="coach" colorScheme="accent">
                    <HStack>
                      <FaUserTie />
                      <Text>Coach</Text>
                    </HStack>
                  </Radio>
                </VStack>
              </RadioGroup>
            </FormControl>

            {/* Save Button */}
            <Button
              type="submit"
              colorScheme={role === 'coach' ? "accent" : "brand"}
              size="lg"
              width="100%"
              isLoading={saving}
              loadingText="Saving..."
              _hover={{ transform: 'translateY(-2px)' }}
              transition="all 0.2s"
            >
              Save Changes
            </Button>
          </VStack>
        </ScaleFade>
      </VStack>
    </Container>
  )
}

export default Profile 