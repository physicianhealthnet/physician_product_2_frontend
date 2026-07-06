import { createSlice } from "@reduxjs/toolkit";

const appointmentSlice = createSlice({
  name: "appointments",
  initialState: {
    count: "",
  },
  reducers: {
    addAppointment: (state, action) => {
      state.count = action.payload.length;
    },
  },
});

export const { addAppointment } = appointmentSlice.actions;

export default appointmentSlice.reducer;
