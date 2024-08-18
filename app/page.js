"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Box,
  FormControl,
  InputLabel,
  AppBar,
  Toolbar,
  Button,
  TextField,
  Stack,
  Modal,
} from "@mui/material";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { firestore } from "@/firebase";
import Head from "next/head";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from "chart.js";

ChartJS.register(Title, Tooltip, Legend, ArcElement);

export default function Admin() {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");

  useEffect(() => {
    const fetchSubmissions = async () => {
      const querySnapshot = await getDocs(collection(firestore, "complaints"));
      const data = querySnapshot.docs.map((doc) => doc.data());
      setSubmissions(data);
      setFilteredSubmissions(data);
    };

    const fetchCategories = async () => {
      const querySnapshot = await getDocs(collection(firestore, "categories"));
      const data = querySnapshot.docs.map((doc) => doc.data().name);
      setCategories(data);
    };

    fetchSubmissions();
    fetchCategories();
  }, []);

  const handleCategoryChange = (event) => {
    const category = event.target.value;
    setCategoryFilter(category);

    if (category === "") {
      setFilteredSubmissions(submissions);
    } else {
      const filtered = submissions.filter(
        (submission) => submission.category === category
      );
      setFilteredSubmissions(filtered);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const addItem = async (category) => {
    if (category.trim() === "") return;

    try {
      await addDoc(collection(firestore, "categories"), { name: category });
      setCategories((prev) => [...prev, category]);
      alert("Category added successfully!");
    } catch (error) {
      console.error("Error adding category: ", error);
    }
  };

  const exportToCSV = () => {
    // Prepare data for CSV export
    const csvData = filteredSubmissions.map((submission) => ({
      Name: submission.name,
      Email: submission.email,
      Message: submission.message,
      Category: submission.category,
    }));

    // Convert data to CSV
    const csv = Papa.unparse(csvData);

    // Create a Blob from the CSV string
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    // Create a link element
    const link = document.createElement("a");
    if (link.download !== undefined) {
      // Set the download attribute with a filename
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "submissions.csv");

      // Append to the DOM and trigger a click event
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = submissions.filter(
      (submission) => submission.category === category
    ).length;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        data: Object.values(categoryCounts),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container maxWidth="lg">
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="Manage submissions and categories" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppBar position="static" sx={{ backgroundColor: "#45474B" }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, color: "white", fontSize: "1.5rem" }}
          >
            Admin Dashboard
          </Typography>
          <Button
            href="/"
            sx={{
              color: "white",
              textTransform: "none",
              fontSize: "1rem",
              backgroundColor: "#45474B",
              "&:hover": { backgroundColor: "#1E201E" },
            }}
          >
            Home
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          p: 4,
          borderRadius: 2,
          mt: 4,
          boxShadow: 2,
        }}
      >
        <Modal open={open} onClose={handleClose}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 400,
              bgcolor: "white",
              border: "2px solid #000",
              boxShadow: 24,
              p: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              transform: "translate(-50%, -50%)",
              borderRadius: 2,
            }}
          >
            <Typography variant="h6">Add New Category</Typography>
            <Stack width="100%" spacing={2}>
              <TextField
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Enter category name"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  addItem(itemName);
                  setItemName("");
                  handleClose();
                }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>

        <Box sx={{ width: "100%", maxWidth: 600, mt: 4 }}>
          <Pie
            data={pieData}
            options={{
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    boxWidth: 10,
                    padding: 15,
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (tooltipItem) {
                      return `${tooltipItem.label}: ${tooltipItem.raw}`;
                    },
                  },
                },
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: 600,
            mt: 4,
          }}
        >
          <FormControl variant="outlined" sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={handleCategoryChange}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category, index) => (
                <MenuItem key={index} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#3FA2F6",
              color: "white",
              "&:hover": { backgroundColor: "#3391D3" },
            }}
            onClick={handleOpen}
          >
            Add Category
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#3FA2F6",
              color: "white",
              ml: 2,
              "&:hover": { backgroundColor: "#3391D3" },
            }}
            onClick={exportToCSV}
          >
            Export CSV
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubmissions.map((submission, index) => (
                <TableRow key={index}>
                  <TableCell>{submission.name}</TableCell>
                  <TableCell>{submission.email}</TableCell>
                  <TableCell>{submission.message}</TableCell>
                  <TableCell>{submission.category}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}
