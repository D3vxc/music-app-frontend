import * as React from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import RegisterValidation from '../validation/RegisterValidation';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const nevigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: zodResolver(RegisterValidation) });


    const submit = handleSubmit(async (data) => {
        await axios.post("/user/add", {
            ...data
        }).then((res) => {
            console.log(data)
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
                        label="firstname"
                        required
                        variant="outlined"
                        {...register("firstname")}
                    /> <br />
                    {errors.firstname?.message}
                    <br />

                    <TextField
                        sx={{ padding: '10px' }}
                        label="lastname"
                        required
                        variant="outlined"
                        {...register("lastname")}
                    /> <br />
                    {errors.lastname?.message}
                    <br />

                    <TextField
                        sx={{ padding: '10px' }}
                        label="username"
                        required
                        variant="outlined"
                        {...register("username")}
                    /> <br />
                    {errors.username?.message}
                    <br />

                    <TextField
                        sx={{ padding: '10px' }}
                        label="email"
                        required
                        variant="outlined"
                        {...register("email")}
                    /> <br />
                    {errors.email?.message}
                    <br />

                    <TextField
                        sx={{ padding: '10px' }}
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