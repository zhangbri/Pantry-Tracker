'use client'
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import firestore from '@/firebase';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, Typography, Stack, TextField, Button } from '@mui/material';
import { collection, deleteDoc, doc, query, getDoc, getDocs, setDoc } from "firebase/firestore";
import ImageCapture from '../app/ImageCapture.js'; 

import addIcon from '../images/Add.png';
import removeIcon from '../images/Minus.png';
import Trash from '../images/x.png';
import backgroundImage from '../images/background.png';
import numeric from '../images/numeric.png';
import revnumeric from '../images/revnumeric.png';
import alpha from '../images/alphabetical.png';
import revalpha from '../images/revalpha.png';

const theme = createTheme({
  typography: {
    fontFamily: 'Arial',
  },
  components: {
    MuiInput: {
      styleOverrides: {
        root: {
          '&:before': {
            borderBottom: 'none',
          },
          '&:after': {
            borderBottom: 'none',
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottom: 'none',
          },
        },
        input: {
          textAlign: 'center',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: '#4CAF50',
          color: 'white',
          '&:hover': {
            backgroundColor: '#45a049',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'black',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'black',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'black',
          },
        },
      },
    },
  },
});

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [originalInventory, setOriginalInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [boxSize, setBoxSize] = useState({ width: Math.max(800, 520), height: '85vh' });
  const resizeRef = useRef(null);
  const [listName, setListName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('listName') || 'My List';
    }
  });
  const [isEditingListName, setIsEditingListName] = useState(false);
  const listNameInputRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [sortType, setSortType] = useState('reverseNumeric');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [identifiedItem, setIdentifiedItem] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraMode, setCameraMode] = useState('initial');
  const [newItemPlaceholder, setNewItemPlaceholder] = useState("Enter New Item");
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search Items");

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        id: doc.id,
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
    setOriginalInventory(inventoryList);
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity > 0) {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const addItem = async (itemName) => {
    if (itemName.trim() === '') return;
    const docRef = doc(collection(firestore, 'inventory'), itemName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    setNewItemName('');
    await updateInventory();
  };

  const handleItemEdit = (index, field, value) => {
    const newInventory = [...inventory];
    if (field === 'quantity') {
      value = Math.max(0, parseInt(value) || 0);
    }
    newInventory[index][field] = value;
    setInventory(newInventory);
  };

  const handleItemSubmit = async (index) => {
    const item = inventory[index];
    if (item.id !== item.name) {
      await setDoc(doc(collection(firestore, 'inventory'), item.name), { quantity: item.quantity });
      await deleteDoc(doc(collection(firestore, 'inventory'), item.id));
    } else {
      await setDoc(doc(collection(firestore, 'inventory'), item.id), { quantity: item.quantity });
    }
    await updateInventory();
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (isResizing && resizeRef.current) {
      const newWidth = Math.max(e.clientX - resizeRef.current.getBoundingClientRect().left, 520);
      const newHeight = e.clientY - resizeRef.current.getBoundingClientRect().top;
      setBoxSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleListNameEdit = () => {
    setIsEditingListName(true);
  };

  const handleListNameChange = (event) => {
    setListName(event.target.value);
  };

  const handleListNameSubmit = () => {
    setIsEditingListName(false);
    localStorage.setItem('listName', listName);
  };

  const deleteItem = async (item) => {
    await deleteDoc(doc(collection(firestore, 'inventory'), item));
    await updateInventory();
  };

  const handleSearch = () => {
    const filteredInventory = originalInventory.filter(item => 
      item.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    setInventory(filteredInventory);
  };
  
  const handleSort = () => {
    let sortedInventory = [...inventory];
    switch (sortType) {
      case 'reverseNumeric':
        sortedInventory.sort((a, b) => b.quantity - a.quantity);
        setSortType('numeric');
        break;
      case 'numeric':
        sortedInventory.sort((a, b) => a.quantity - b.quantity);
        setSortType('alphabetical');
        break;
      case 'alphabetical':
        sortedInventory.sort((a, b) => a.name.localeCompare(b.name));
        setSortType('reverseAlphabetical');
        break;
      case 'reverseAlphabetical':
        sortedInventory.sort((a, b) => b.name.localeCompare(a.name));
        setSortType('reverseNumeric');
        break;
    }
    setInventory(sortedInventory);
  };

  const getSortButtonContent = () => {
    switch (sortType) {
      case 'reverseNumeric':
        return (
          <>
            <span>sort:</span>
            <Image src={revnumeric} alt="Reverse Numeric" width={20} height={20} style={{ marginLeft: '2px' }} />
          </>
        );
      case 'numeric':
        return (
          <>
            <span>sort:</span>
            <Image src={numeric} alt="Numeric" width={20} height={20} style={{ marginLeft: '2px' }} />
          </>
        );
      case 'alphabetical':
        return (
          <>
            <span>sort:</span>
            <Image src={alpha} alt="Alphabetical" width={20} height={20} style={{ marginLeft: '2px' }} />
          </>
        );
      case 'reverseAlphabetical':
        return (
          <>
            <span>sort:</span>
            <Image src={revalpha} alt="Reverse Alphabetical" width={20} height={20} style={{ marginLeft: '2px' }} />
          </>
        );
    }
  };

  const handleReset = () => {
    setInventory(originalInventory);
    setSearchTerm('');
  };

  const handleTakePhoto = () => {
    setCameraMode('capture');
  };

  const handleCapturePhoto = (imageDataUrl) => {
    setCapturedImage(imageDataUrl);
    setCameraMode('preview');
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setIdentifiedItem('');
    setCameraMode('capture');
  };

  const handleDone = () => {
    setCameraMode('initial');
    setCapturedImage(null);
    setIdentifiedItem('');
  };

  const handleUploadPhoto = async () => {
    const classification = "Classified Item";
    setIdentifiedItem(classification);
    addItem(classification);
    setCameraMode('capture');
    setCapturedImage(null);
  };

  const handleNewItemFocus = () => {
    setNewItemPlaceholder("");
  };

  const handleNewItemBlur = () => {
    if (newItemName === "") {
      setNewItemPlaceholder("Enter New Item");
    }
  };

  const handleSearchFocus = () => {
    setSearchPlaceholder("");
  };

  const handleSearchBlur = () => {
    if (searchTerm === "") {
      setSearchPlaceholder("Search Items");
    }
  };

  return (
    <ThemeProvider theme={theme}>
    <Box
      sx={{
        width: '100vw', 
        height: '100vh',
        backgroundImage: `url(${backgroundImage.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center', 
        backgroundRepeat: 'no-repeat', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 1,
        gap: 2
      }}
    >
      <Box position="absolute" left="20px" top="20px">
        <Typography variant="h4" style={{ fontFamily: 'Pacifico, cursive' }}>
          PantryMate
        </Typography>
      </Box>
      <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          width={boxSize.width}
          position="relative"
        >
        <Box 
            onClick={handleListNameEdit} 
            sx={{ 
              cursor: 'text', 
              mb: 2,
              position: 'relative',
              width: '100%',
            }}
          >
          <input
            ref={listNameInputRef}
            value={listName}
            onChange={handleListNameChange}
            onBlur={handleListNameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleListNameSubmit();
              }
            }}
            style={{
              fontFamily: 'Pacifico, cursive',
              fontSize: '3rem',
              textAlign: 'center',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              cursor: 'text',
            }}
            readOnly={!isEditingListName}
          />
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" width="99%" mb={1}>
          <TextField
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={newItemPlaceholder}
            variant="outlined"
            size="small"
            onFocus={handleNewItemFocus}
            onBlur={handleNewItemBlur}
            sx={{ 
              width: '30%',
              '& input::placeholder': {
                color: 'black',
                opacity: 1,
              },
            }}
          />
          <Button 
            variant="contained" 
            onClick={() => addItem(newItemName)}
            sx={{ textTransform: 'capitalize' }}
          >
            Add
          </Button>
          <TextField
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            variant="outlined"
            size="small"
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            sx={{ 
              width: '27%',
              '& input::placeholder': {
                color: 'black',
                opacity: 1,
              },
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            sx={{ textTransform: 'capitalize' }}
            >
              Search
          </Button>
          <Button 
            variant="contained" 
            onClick={handleReset}
            sx={{ textTransform: 'capitalize' }}
            >
              Reset
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSort}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              textTransform: 'capitalize'
            }}
          >
            {getSortButtonContent()}
          </Button>
        </Box>
      <Box
        ref={resizeRef} 
        border="5px solid #DEB887"
        borderRadius="15px" 
        overflow="hidden" 
        width={boxSize.width}
        height={boxSize.height}
        display="flex"
        flexDirection="column"
        position="relative"
        style={{ resize: 'both', overflow: 'auto' }}
        sx={{
          minWidth: '520px',
          resize: 'both',
          overflow: 'auto'
        }}
      >
      <Box
        width="100%"
        height="80px"
        bgcolor="#DEB887"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          <Typography variant="h3" color="black" textAlign="center">
            Item
          </Typography>
        </Box>
        <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          <Typography variant="h3" color="black" textAlign="center">
            Quantity
          </Typography>
        </Box>
        <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          <Typography variant="h3" color="black" textAlign="center">
            Actions
          </Typography>
        </Box>
      </Box>
      <Stack 
        width="100%" 
        height="100%" 
        spacing={0} 
        overflow="auto"
        className="hide-scrollbar"
      >
        {inventory.map(({id, name, quantity,}, index) => (
          <Box 
            key={id}
            width="100%"
            minHeight="80px"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            sx={{
              position: 'relative',
              '&:hover': {
                backgroundColor: '#EEE8AA',
              },
              borderBottom: '2px solid #DEB887',
            }}
            position="relative"
          >
          <Box
            position="absolute"
            left={0}
            top={0}
            bottom={0}
            width="10%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ 
              zIndex: 1,
            }}
          >
            {hoveredIndex === index && (
              <Image
                src={Trash}
                alt="Delete Item"
                style={{ cursor: 'pointer', width: '30px', height: '30px' }}
                onClick={() => deleteItem(name)}
              />
            )}
          </Box>
          <Box flex={1} display="flex" justifyContent="center" alignItems="center">
              <TextField
                value={name}
                onChange={(e) => handleItemEdit(index, 'name', e.target.value)}
                onBlur={() => handleItemSubmit(index)}
                variant="standard"
                inputProps={{ style: { fontSize: '2rem', textAlign: 'center' } }}
              />
            </Box>
            <Box flex={1} display="flex" justifyContent="center" alignItems="center">
              <TextField
                value={quantity}
                onChange={(e) => handleItemEdit(index, 'quantity', e.target.value)}
                onBlur={() => handleItemSubmit(index)}
                variant="standard"
                InputProps={{ 
                  style: { fontSize: '2rem', textAlign: 'center' },
                  inputProps: { min: 0 } 
                }}
              />
            </Box>
            <Box flex={1} display="flex" justifyContent="center" alignItems="center">
              <Stack direction="row" spacing={5} justifyContent="center">
                <Image
                  src={addIcon}
                  alt="Add Item"
                  style={{ cursor: 'pointer', width: '40px', height: '40px' }}
                  onClick={() => addItem(name)}
                />
                <Image
                  src={removeIcon}
                  alt="Remove Item"
                  style={{ 
                    cursor: quantity > 0 ? 'pointer' : 'not-allowed', 
                    width: '40px', 
                    height: '40px',
                    opacity: quantity > 0 ? 1 : 0.5 
                  }}
                  onClick={() => quantity > 0 && removeItem(name)}
                />
              </Stack>
            </Box>
          </Box>
        ))}
      </Stack>
      <Box
        position="absolute"
        bottom={0}
        right={0}
        width={40}
        height={40}
        bgcolor="rgba(0,0,0,0)"
        cursor="se-resize"
        onMouseDown={handleMouseDown}
        display="flex"
        justifyContent="center"
        alignItems="center"
      />
      </Box>
      <Box width="100%" mt={1.5} display="flex" justifyContent="center">
          {cameraMode === 'initial' && (
            <Button 
              variant="contained" 
              onClick={handleTakePhoto}
              sx={{ textTransform: 'capitalize' }}
            >
              Take Photo
            </Button>
          )}
        </Box>
      {cameraMode !== 'initial' && (
        <Box 
          width="640px" 
          height="480px" 
          mb={2} 
          sx={{ 
            borderRadius: '15px',
            overflow: 'hidden'
          }}
        >
          {cameraMode === 'capture' && <ImageCapture onCapture={handleCapturePhoto} />}
          {cameraMode === 'preview' && <img src={capturedImage} alt="Captured item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </Box>
      )}

      {cameraMode === 'capture' && (
        <Box display="flex" justifyContent="center" mt={-0.5}>
          <Button 
            variant="contained" 
            onClick={() => document.querySelector('#captureButton').click()}
            sx={{ 
              mr: 1,
              textTransform: 'capitalize'
            }}
          >
            Capture Photo
          </Button>
          <Button 
            variant="contained" 
            onClick={handleDone}
            sx={{ textTransform: 'capitalize' }}
          >
            Done
          </Button>
        </Box>
      )}

      {cameraMode === 'preview' && (
        <Box display="flex" justifyContent="center" mt={-0.5}>
          <Button 
            variant="contained" 
            onClick={handleRetakePhoto}
            sx={{ 
              mr: 1,
              textTransform: 'capitalize'
            }}
          >
            Retake Photo
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUploadPhoto}
            sx={{ 
              mr: 1,
              textTransform: 'capitalize'
            }}
          >
            Upload
          </Button>
          <Button 
            variant="contained" 
            onClick={handleDone}
            sx={{ textTransform: 'capitalize' }}
          >
            Done
          </Button>
        </Box>
      )}
    </Box>
    <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        width={boxSize.width}
        mt={-0.5}
      >
    </Box>
  </Box>
</ThemeProvider>
);}
