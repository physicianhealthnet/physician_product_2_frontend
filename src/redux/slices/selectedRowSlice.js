import { createSlice } from "@reduxjs/toolkit";

export const selectedRowSlice = createSlice({
  name: "selectedRow",
  initialState: [],
  reducers: {
    setSelectedRow: (state, action) => action.payload,
    clearSelectedRow: (state) => null,
  },
});

export const { setSelectedRow, clearSelectedRow } = selectedRowSlice.actions;

export default selectedRowSlice.reducer;
