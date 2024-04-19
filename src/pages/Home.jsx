import React from 'react';
import { Container } from '@mui/material';
import Navbar from './Navbar'
import { Outlet } from 'react-router-dom';
// import Songs from './Songs';

export default function Home() {
    return (
        <>
            <Container maxWidth="sm" sx={{ mt: '10%' }}>
                <Navbar />
                {/* <Songs /> */}
            </Container>
            <Outlet />
        </>
    )
}
