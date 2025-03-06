import { Box, Container, Flex, IconButton } from "@chakra-ui/react"
import { FaHome, FaPlusSquare, FaUser, FaRegComments } from "react-icons/fa"
import { Link } from "react-router-dom"

function Navbar() {
  return (
    <Box 
      position="fixed" 
      top={0} 
      left={0} 
      right={0} 
      bg="black.800"
      borderBottom="1px" 
      borderColor="black.700" 
      zIndex={100}
      boxShadow="lg"
      backdropFilter="blur(10px)"
      bgGradient="linear(to-b, black.800, black.900)"
    >
      <Container maxW="container.md" py={3}>
        <Flex justify="space-between" align="center">
          {/* Logo */}
          <Link to="/">
            <Box 
              fontSize="2xl" 
              fontWeight="bold" 
              bgGradient="linear(to-r, brand.400, accent.400)"
              bgClip="text"
              _hover={{ opacity: 0.8 }}
              transition="opacity 0.2s"
            >
              LiftSocial
            </Box>
          </Link>

          {/* Navigation Icons */}
          <Flex gap={4}>
            <Link to="/">
              <IconButton
                aria-label="Home"
                icon={<FaHome size="20px" />}
                variant="ghost"
                colorScheme="brand"
                color="black.400"
                _hover={{ 
                  color: "brand.400",
                  transform: 'translateY(-2px)'
                }}
                transition="all 0.2s"
              />
            </Link>
            <Link to="/messages">
              <IconButton
                aria-label="Messages"
                icon={<FaRegComments size="20px" />}
                variant="ghost"
                colorScheme="brand"
                color="black.400"
                _hover={{ 
                  color: "brand.400",
                  transform: 'translateY(-2px)'
                }}
                transition="all 0.2s"
              />
            </Link>
            <Link to="/create">
              <IconButton
                aria-label="Create Post"
                icon={<FaPlusSquare size="20px" />}
                variant="ghost"
                colorScheme="brand"
                color="black.400"
                _hover={{ 
                  color: "brand.400",
                  transform: 'translateY(-2px)'
                }}
                transition="all 0.2s"
              />
            </Link>
            <Link to="/profile">
              <IconButton
                aria-label="Profile"
                icon={<FaUser size="20px" />}
                variant="ghost"
                colorScheme="brand"
                color="black.400"
                _hover={{ 
                  color: "brand.400",
                  transform: 'translateY(-2px)'
                }}
                transition="all 0.2s"
              />
            </Link>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}

export default Navbar; 