import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    theme: 'light',
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        // Keeping toggleTheme as a no-op to prevent breaking components that might still call it
        toggleTheme: (state) => {
            state.theme = 'light';
        },
        setTheme: (state) => {
            state.theme = 'light';
        }
    },
});

export const { toggleTheme, setTheme } = themeSlice.actions;

export default themeSlice.reducer;
