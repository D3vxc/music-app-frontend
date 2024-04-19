import * as React from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { zodResolver } from "@hookform/resolvers/zod";
import LoginValidation from "../validation/UserLoginValidation";
import { useForm } from "react-hook-form";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const nevigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: zodResolver(LoginValidation) });

    const submit = handleSubmit(async (data) => {
        await axios.post("/user/userlogin", {
            ...data
        }).then((res) => {
            console.log(data);
            console.log(res.data);
            if (res.status === 200) {
                nevigate("/songs")
            }
        }).catch((error) => {
            console.log(error);
        })
    });

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: "center" }}>

                <form action="" onSubmit={submit}>
                    <TextField
                        sx={{ padding: '10px' }}
                        id="outlined-basic"
                        label="username"
                        required
                        variant="outlined"
                        {...register("username")}
                    /> <br />
                    {errors.username?.message}
                    <br />

                    <TextField
                        sx={{ padding: '10px' }}
                        id="outlined-password-input"
                        required
                        label="password"
                        type="password"
                        autoComplete='current-password'
                        {...register("password")}
                    /> <br />
                    {errors.password?.message}
                    <br /> <br />

                    <Button type='submit'>submit</Button>
                </form>
            </div>
        </>
    )
}