import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  painLevel: 0,
};

const vasScaleSlice = createSlice({
  name: "vasScale",
  initialState,
  reducers: {
    setPainLevel: (state, action) => {
      state.painLevel = action.payload;
    },
  },
});

export const { setPainLevel } = vasScaleSlice.actions;
export default vasScaleSlice.reducer;
