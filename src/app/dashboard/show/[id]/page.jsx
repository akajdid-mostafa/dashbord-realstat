"use client";
import React, { useContext, useState } from "react";
import { useParams } from "next/navigation";
import { DataContext } from "@/contexts/post";
import { useRouter } from "next/navigation";
import {
  Grid,
  Typography,
  Paper,
  Box,
  Card,
  CardMedia,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText
} from "@mui/material";
import Link from "next/link";

function Page() {
  const { id } = useParams();

  const { detail, data } = useContext(DataContext);

  // Filter details based on postId (convert both to numbers for proper comparison)
  const filteredDetails = detail?.filter((item) => Number(item.postId) === Number(id));

  // Filter images from data based on id (convert both to numbers for proper comparison)
  const filteredData = data?.filter((item) => Number(item.id) === Number(id));

  // Modal open state
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const router = useRouter();

  // Handle opening the delete confirmation dialog
  const handleClickOpenDelete = (id) => {
    setSelectedDeleteId(id);
    setOpenDelete(true);
  };

  // Handle closing the delete confirmation dialog
  const handleCloseDelete = () => {
    setOpenDelete(false);
    setSelectedDeleteId(null);
  };

  // Handle the delete action
  const handleDelete = async () => {
    try {
      const response = await fetch(`https://realestat.vercel.app/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Post deleted successfully!');
        setOpenDelete(false);
        router.push("/dashboard/posts")
      } else {
        console.error('Error deleting post:', await response.text());
        alert('Error deleting post. Please try again later.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post. Please try again later.');
    } finally {
      setOpenDelete(false);
    }
  };

  return (
    <Box p={4}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Post Details
          </Typography>
        </Grid>

        {/* Post Information Section */}
        {filteredData?.length > 0 ? (
          filteredData.map((item, key) => (
            <Grid item xs={12} key={key}>
              <Paper elevation={4} sx={{ padding: 3, mb: 2 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
                  {item.title || 'Untitled Post'}
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>Post ID:</strong> {item.id}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>Status:</strong> 
                      <Box
                        component="span"
                        sx={{
                          ml: 1,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: 
                            item.status === 'available' ? 'success.light' :
                            item.status === 'unavailable' ? 'error.light' :
                            'warning.light',
                          color: 'white',
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}
                      >
                        {item.status || 'N/A'}
                      </Box>
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>Price:</strong> {item.prix ? `${item.prix.toLocaleString()} MAD` : 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>Address:</strong> {item.adress || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>City:</strong> {item.ville || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>Category:</strong> {item.category?.name || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>Type:</strong> {item.type?.type || 'N/A'}
                    </Typography>
                  </Grid>

                  {(item.lat && item.lon) && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body1">
                        <strong>Location:</strong> {item.lat.toFixed(6)}, {item.lon.toFixed(6)}
                      </Typography>
                    </Grid>
                  )}

                  {item.youtub && (
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        <strong>YouTube:</strong>{' '}
                        <Link 
                          href={item.youtub} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#1976d2', textDecoration: 'none' }}
                        >
                          {item.youtub}
                        </Link>
                      </Typography>
                    </Grid>
                  )}

                  {item.comment && (
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        <strong>Comment:</strong> {item.comment}
                      </Typography>
                    </Grid>
                  )}

                  {item.datePost && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body1">
                        <strong>Date Posted:</strong> {new Date(item.datePost).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {/* Action Buttons */}
                <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <Link href={`/dashboard/All/${id}`}>
                    <Button variant="contained" color="primary">
                      Update Post
                    </Button>
                  </Link>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={() => handleClickOpenDelete(id)}
                  >
                    Delete Post
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ padding: 3, backgroundColor: '#f5f5f5', mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Post not found.
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* Property Details Section */}
        {filteredDetails?.length > 0 ? (
          filteredDetails.map((item, key) => (
            <Grid item xs={12} md={6} key={key}>
              <Paper elevation={4} sx={{ padding: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" fontWeight="bold">
                      Property Details
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Construction Year:</strong> {item.constructionyear}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Surface:</strong> {item.surface} m²
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Rooms:</strong> {item.rooms}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Bedrooms:</strong> {item.bedromms || item.bedrooms || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Bathrooms:</strong> {item.bathrooms || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Floor:</strong> {item.floor}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Kitchen:</strong> {item.kitchen}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Furnished:</strong> {item.furnished}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Elevator:</strong> {item.elevator}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Parking:</strong> {item.parking}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Balcony:</strong> {item.balcony}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Pool:</strong> {item.pool}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Guard:</strong> {item.Guard}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Proprietary:</strong> {item.Proprietary}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Facade:</strong> {item.facade}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Documents:</strong> {item.documents}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Action Buttons for each item */}
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Link href={`/dashboard/All/${id}`}> 
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ mr: 2 }}
                    >
                      Update Details
                    </Button>
                  </Link>
                </Box>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ padding: 3, backgroundColor: '#f5f5f5' }}>
              <Typography variant="body1" color="text.secondary">
                No details found for this post.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Post ID: {id} | Details loaded: {detail?.length || 0} | Details with matching postId: {detail?.filter((item) => Number(item.postId) === Number(id)).length || 0}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                component={Link}
                href={`/dashboard/detail/${id}`}
              >
                Add Details
              </Button>
            </Paper>
          </Grid>
        )}

        {/* Images Section */}
        {filteredData?.length > 0 ? (
          filteredData.map((item, key) => (
            <Grid item xs={12} key={key}>
              <Paper elevation={4} sx={{ padding: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Images
                </Typography>
                <Grid container spacing={3}>
                  {item.img && item.img.length > 0 ? (
                    item.img.map((imageUrl, imgKey) => (
                      <Grid item xs={12} sm={6} md={4} key={imgKey}>
                        <Card sx={{ boxShadow: 3 }}>
                          <CardMedia
                            component="img"
                            height="400"
                            width="500"
                            image={imageUrl}
                            alt={`Image ${imgKey}`}
                            sx={{ borderRadius: 2 }}
                          />
                        </Card>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Typography variant="body2">No images found.</Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="body1">No images found for this post.</Typography>
          </Grid>
        )}
  <Dialog
          open={openDelete}
          onClose={handleCloseDelete}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete this Post? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDelete} color="primary">
              Cancel
            </Button>
            <Button
              onClick={() => handleDelete(selectedDeleteId)} // Pass selectedDeleteId to the delete function
              color="secondary"
              autoFocus
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Update Modal */}
     
      </Grid>
    </Box>
  );
}

export default Page;
