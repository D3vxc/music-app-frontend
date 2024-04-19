import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Link } from "react-router-dom";
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import { IconButton, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SpotifyIcon from "../../assets/logo/spotify-logo2.png"

export default function ButtonAppBar() {
    const Navigate = useNavigate()
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const userhandleClose = () => {
        Navigate("/login/userlogin")
        setAnchorEl(null);
    };

    const artisthandleClose = () => {
        Navigate("/login/artistlogin")
        setAnchorEl(null);
    };


    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="absolute">
                <Toolbar sx={{ background: 'black', display: 'flex' }} >
                    <Grid container >
                        <Grid item xl={4} lg={4} md={4} sm={12} xs={12}  >

                            <Box sx={{ background: 'black', display: 'flex', justifyContent: 'flex-start', height: "50px" }} >
                                <Link to="/">
                                    <img
                                        src={SpotifyIcon}
                                        alt=""
                                        style={{ height: "100%" }}
                                    />
                                </Link>
                            </Box>
                        </Grid>
                        <Grid item xl={4} lg={4} md={4} sm={12} xs={12}>
                            <Box sx={{ background: 'black', display: 'flex', justifyContent: 'space-evenly' }} >
                                <TextField sx={{ borderRadius: '35px', bgcolor: '#FBFBF8', width: '100%' }} placeholder='Search'
                                    InputProps={{
                                        endAdornment: <IconButton>
                                            <SearchIcon />
                                        </IconButton>
                                    }}
                                ></TextField>
                            </Box>

                        </Grid>
                        <Grid item xl={4} lg={4} md={4} sm={12} xs={12}>
                            <Box sx={{ background: 'black', display: 'flex', justifyContent: 'flex-end', marginTop: "15px", marginright: "10px", gap: "10%" }}>
                                <Link to="/register" style={{ textDecoration: 'none', color: '#F5F5F5' }}>
                                    <Typography sx={{ textDecoration: 'none', color: '#F5F5F5' }}>
                                        REGISTER
                                    </Typography>
                                </Link>
                                < Typography >

                                    <Button sx={{ textDecoration: 'none', color: '#F5F5F5' }}
                                        id="basic-button"
                                        aria-controls={open ? 'basic-menu' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={open ? 'true' : undefined}
                                        onClick={handleClick}
                                    >
                                        Login
                                    </Button>
                                    <Menu
                                        id="basic-menu"
                                        anchorEl={anchorEl}
                                        open={open}
                                        onClose={userhandleClose}
                                        MenuListProps={{
                                            'aria-labelledby': 'basic-button',
                                        }}
                                    >
                                        <MenuItem onClick={artisthandleClose} >Artist Login</MenuItem>
                                        <MenuItem onClick={userhandleClose} >User Login</MenuItem>
                                    </Menu>
                                </Typography>
                            </Box>

                        </Grid>
                    </Grid>


                </Toolbar>
            </AppBar >
        </Box >
    );
}