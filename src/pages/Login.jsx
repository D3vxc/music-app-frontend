import React from 'react';
import Navbar from './Navbar'
import { Container } from '@mui/material';

import { Outlet } from 'react-router-dom';
export default function Login() {
    return (
        <>
            <Container maxWidth="sm" sx={{ mt: '10%' }}>
                <Navbar />
            </Container>
            <Outlet />
        </>
    )
}