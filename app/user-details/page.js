// user-details/page.js
'use client';

import React, { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Box, TextField, Button, Container, Typography, InputAdornment, Alert } from '@mui/material';
import Head from 'next/head';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import axios from 'axios';


export default function UserDetailsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    address: '', 
    location: '',
    bio: '',
    areaOfInterest: '',
    lookingFor: '', 
    linkedIn: '',
    github: '',
    instagram: '',
    twitter: '',
  });

  const [errors, setErrors] = useState({});
  const [validFields, setValidFields] = useState({});
  const [success, setSuccess] = useState(false);
  const refs = {
    fullName: useRef(null),
    address: useRef(null), 
    location: useRef(null),
    bio: useRef(null),
    areaOfInterest: useRef(null),
    lookingFor: useRef(null), 
    linkedIn: useRef(null),
    github: useRef(null),
    instagram: useRef(null),
    twitter: useRef(null),
  };

  // Validation function
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'fullName':
        if (!value.trim()) error = 'Full Name is required';
        else if (value.length > 50) error = 'Full Name cannot exceed 50 characters';
        break;
      case 'address':
        if (!value.trim()) error = 'Address is required';
        break;
      case 'location':
        if (!value.trim()) {
          error = 'Location is required';
        } else if (!/^[a-zA-Z\s]+,\s?[a-zA-Z\s]+,\s?[a-zA-Z\s]+$/.test(value)) {
          error = 'Location must be in "City, State, Country" format';
        }
        break;
      case 'bio':
        if (!value.trim()) error = 'Bio Summary is required';
        else if (value.length > 150) error = 'Bio Summary cannot exceed 150 characters';
        break;
      case 'areaOfInterest':
        if (!value.trim()) error = 'Area of Interest is required';
        break;
      case 'linkedIn':
        if (value && !/^https:\/\/[a-z]{2,3}\.linkedin\.com\/.*$/.test(value)) error = 'Enter a valid LinkedIn URL';
        break;
      case 'github':
        if (value && !/^https:\/\/github\.com\/.*$/.test(value)) error = 'Enter a valid GitHub URL';
        break;
      case 'instagram':
        if (value && !/^https:\/\/(www\.)?instagram\.com\/.*$/.test(value)) error = 'Enter a valid Instagram URL';
        break;
      case 'twitter':
        if (value && !/^https:\/\/twitter\.com\/.*$/.test(value)) error = 'Enter a valid Twitter URL';
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    setValidFields((prev) => ({ ...prev, [name]: !error }));
    return !error;
  };

  // Handle field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle field blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (validateField(name, value)) {
      const fieldNames = Object.keys(formData);
      const currentIndex = fieldNames.indexOf(name);
      const nextField = fieldNames[currentIndex + 1];
      if (nextField && refs[nextField].current) {
        refs[nextField].current.focus();
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = Object.keys(formData).every((key) => validateField(key, formData[key]));
    // if (isValid) {
    //   const userDetails = {
    //     ...formData,
    //     username: user?.username || 'default_username',
    //     email: user?.emailAddresses[0]?.emailAddress || 'default_email@example.com',
    //   };
      console.log("Location from formData", formData.address)
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    console.log("apiKey", apiKey)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${formData.address}&key=${apiKey}`;
    try {
      console.log("inside try")
      // const response = await fetch(`https://api.geoapify.com/v1/geocode/search?text=38%20Upper%20Montagu%20Street%2C%20Westminster%20W1H%201LJ%2C%20United%20Kingdom&apiKey=d91d27afeb5f47be87de5c4bfe6165bf`);
      // const response = await fetch(url);
      // const data;
      axios({
        method: 'get',
        url: url,
      })
        .then(async function (response) {
          // response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'))
          console.log("response", response)

          if (response.status === 200) {
            const data = response.data;
            if (data.results && data.results[0] && data.results[0].geometry && data.results[0].geometry.location) {
              console.log("data", data.results[0].geometry.location)
              const coord = data.results[0].geometry.location;
              const lng = coord.lng
              const lat = coord.lat
              console.log({ lng, lat });

              const isValid = Object.keys(formData).every((key) => validateField(key, formData[key]));
              console.log("formData",formData)

              if (isValid) {
                const userDetails = {
                  username: user?.username || 'default_username',
                  email: user?.emailAddresses[0]?.emailAddress || 'default_email@example.com',
                  lat: lat,
                  lng: lng,
                  ...formData,
                };
                console.log("User details from handle submit",userDetails)
                try {
                  const response = await fetch('/api/user-details', { 
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userDetails),
                  })
                    .then(function(response){
                      console.log("inside axios post response")
                      if (response.ok) {
                        setSuccess(true);
                        setTimeout(() => {
                          router.push('/sign-in');
                        }, 2000);
                      } else {
                        console.error('Failed to submit user details');
                        console.log("inside axios post after ok",response);
                      }
                    });
                } catch (error) {
                  console.error('Error submitting user details:', error);
                }
              }
            }
          } else {
            throw new Error(`Geocoding failed: ${data.status}`);
          }
        });
      } catch (error) {
        console.error(error);
        return null;
      }                          
  
    } 
  
  //     try {
  //       const response = await fetch('/api/user-details', { 
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify(userDetails),
  //       });
  
  //       if (response.ok) {
  //         setSuccess(true);
  //         setTimeout(() => {
  //           router.push('/sign-in');
  //         }, 2000);
  //       } else {
  //         console.error('Failed to submit user details');
  //       }
  //     } catch (error) {
  //       console.error('Error submitting user details:', error);
  //     }
  //   }
  // };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #E0F7FA, #FFFFFF)',
        padding: 3,
      }}
    >
      <Head>
        <title>User Details - Club3</title>
        <meta name="description" content="Complete your profile details on Club3" />
      </Head>
      <Container maxWidth="sm">
        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 4, borderRadius: 4, boxShadow: 3 }}
        >
          <Typography variant="h5" sx={{ mb: 3, color: '#333', fontWeight: 'bold' }}>
            Complete Your Profile
          </Typography>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Profile details submitted successfully! Redirecting to sign-in...
            </Alert>
          )}
          {Object.keys(formData).map((field) => (
            <TextField
              key={field}
              fullWidth
              label={
                field === 'location'
                  ? 'Location (e.g., City, State, Country)'
                  : field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')
              }
              name={field}
              value={formData[field]}
              onChange={handleChange}
              onBlur={handleBlur}
              inputRef={refs[field]}
              error={!!errors[field]}
              helperText={errors[field]}
              placeholder={field === 'location' ? 'e.g., New York, NY, USA' : ''}
              InputProps={{
                endAdornment: validFields[field] ? (
                  <InputAdornment position="end">
                    <CheckCircleOutlineIcon sx={{ color: 'green' }} />
                  </InputAdornment>
                ) : null,
              }}
              inputProps={{
                maxLength: field === 'fullName' ? 50 : field === 'bio' ? 150 : undefined,
              }}
              sx={{ mb: 2 }}
              required={['fullName', 'address', 'location', 'bio', 'areaOfInterest'].includes(field)}
            />
          ))}
          <Button
            variant="contained"
            type="submit"
            sx={{
              background: 'linear-gradient(to right, #4f758f, #449fdb)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(to right, #3b5f7a, #307fcc)',
              },
              mt: 2,
            }}
          >
            Submit
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
