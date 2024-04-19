import React from "react";
import {
    RouterProvider,
    createBrowserRouter,
} from "react-router-dom"

import Home from "./pages/Home";
import Register from "./pages/Register";
import UserLogin from "./pages/UserLogin";
import ArtistLogin from "./pages/ArtistLogin"
import Songs from "./pages/Songs";
import UploadSong from "./pages/UploadSong";
import Login from "./pages/Login";

const router = createBrowserRouter([
    {
        path: "/",
        //Outlet
        element: <Home />,
        children: [
            {
                path: "register",
                element: <Register />
            },
            {

                path: "login",
                //Outlet
                element: <Login />,
                children: [
                    {
                        path: "userlogin",
                        element: <UserLogin />
                    },
                    {
                        path: "artistlogin",
                        element: <ArtistLogin />,
                        children: [
                            {
                                path: "uploadsong",
                                element: <UploadSong />
                            },
                        ]
                    }
                ]
            },

            {
                path: "songs",
                element: <Songs />,
            }
        ]
    },
]);

export default function Router() {
    return <RouterProvider router={router}></RouterProvider>;
}