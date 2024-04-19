import React from 'react'
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function AddSong() {
    return (
        <>xksakjxnn
            <form action="" >
                <TextField
                    sx={{ padding: '10px' }}
                    id="outlined-basic"
                    label="songname"
                    required
                    variant="outlined"
                    {...register("songname")}
                /> <br />
                {errors.songname?.message}
                <br />

                <TextField
                    sx={{ padding: '10px' }}
                    id="outlined-basic"
                    label="artistname"
                    required
                    variant="outlined"
                    {...register("artistname")}
                /> <br />
                {errors.artistname?.message}
                <br />

                <Stack direction="row" alignItems="center" spacing={2}>
                    <Button variant="contained" component="label">
                        Upload
                        <input hidden accept="image/*" multiple type="file" />
                    </Button>
                </Stack>

                <Button type='submit'>submit</Button>
            </form>
        </>
    )
}
