import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  ankleAndFoot: [],
  shoulder: [],
  cervicalSpineAndNeckFinal: [],
  lumbarSpineFinal1: [],
  lumbarSpineFinal2: [],
  kneeAndThigh: [],
  hipAndThigh: [],
  elbowAndForearm: [],
  dorsalSpine: [],
  TJM: [],
  coccygealJoint: [],
  iliacJoint: [],
};

const pointerSlice = createSlice({
  name: "pointer",
  initialState,
  reducers: {
    // Update or replace ankleAndShoulder points
    updateAnkleAndFoot: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.ankleAndFoot = action.payload; // Replace with new points
      }
    },
    // Update or replace shoulder points
    updateShoulder: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.shoulder = action.payload; // Replace with new points
      }
    },
    // Update or replace CervicalSpineAndNeckFinal points
    updateCervicalSpineAndNeckFinal: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.cervicalSpineAndNeckFinal = action.payload; // Replace with new points
      }
    },
    // Update or replace lumbarSpineFinal1 points
    updateLumbarSpineFinal1: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.lumbarSpineFinal1 = action.payload; // Replace with new points
      }
    },
    // Update or replace lumbarSpineFinal2 points
    updateLumbarSpineFinal2: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.lumbarSpineFinal2 = action.payload; // Replace with new points
      }
    },
    // Update or replace kneeAndThigh points
    updateKneeAndThigh: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.kneeAndThigh = action.payload; // Replace with new points
      }
    },
    // Update or replace hipAndThigh points
    updateHipAndThigh: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.hipAndThigh = action.payload; // Replace with new points
      }
    },
    // Update or replace elbowAndForearm points
    updateElbowAndForearm: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.elbowAndForearm = action.payload; // Replace with new points
      }
    },
    // Update or replace dorsalSpine points
    updateDorsalSpine: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.dorsalSpine = action.payload; // Replace with new points
      }
    },
    // Update or replace TJM points
    updateTJM: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.TJM = action.payload; // Replace with new points
      }
    },
    // Update or replace Coccygeal Joint points
    updateCoccygealJoint: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.coccygealJoint = action.payload; // Replace with new points
      }
    },
    // Update or replace Iliac Joint points
    updateIliacJoint: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.iliacJoint = action.payload; // Replace with new points
      }
    },

    // Remove a specific pointer from AnkleAndFoot
    clearAnkleAndFoot: (state, action) => {
      state.ankleAndFoot = state.ankleAndFoot.filter(
        (_, index) => index !== action.payload
      );
    },
    // Remove a specific pointer from shoulder
    clearShoulder: (state, action) => {
      state.shoulder = state.shoulder.filter(
        (_, index) => index !== action.payload
      );
    },
    // Remove a specific pointer from cervicalSpineAndNeckFinal
    clearCervicalSpineAndNeckFinal: (state, action) => {
      state.cervicalSpineAndNeckFinal = state.cervicalSpineAndNeckFinal.filter(
        (_, index) => index !== action.payload
      );
    },
    // Remove a specific pointer from lumbarSpineFinal1
    clearLumbarSpineFinal1: (state, action) => {
      state.lumbarSpineFinal1 = state.lumbarSpineFinal1.filter(
        (_, index) => index !== action.payload
      );
    },
    // Remove a specific pointer from lumbarSpineFinal2
    clearLumbarSpineFinal2: (state, action) => {
      state.lumbarSpineFinal2 = state.lumbarSpineFinal2.filter(
        (_, index) => index !== action.payload
      );
    },
    // Remove a specific pointer from kneeAndThigh
    clearKneeAndThigh: (state, action) => {
      state.kneeAndThigh = state.kneeAndThigh.filter(
        (_, index) => index !== action.payload
      );
    },
    // Remove a specific pointer from hipAndThigh
    clearHipAndThigh: (state, action) => {
      state.hipAndThigh = state.hipAndThigh.filter(
        (_, index) => index !== action.payload
      );
    },
    // Remove a specific pointer from elbowAndForearm
    clearElbowAndForearm: (state, action) => {
      state.elbowAndForearm = state.elbowAndForearm.filter(
        (_, index) => index !== action.payload
      );
    },
    // Remove a specific pointer from dorsalSpine
    clearDorsalSpine: (state, action) => {
      state.dorsalSpine = state.dorsalSpine.filter(
        (_, index) => index !== action.payload
      );
    },
    // Remove a specific pointer from coccygealJoint
    clearCoccygealJoint: (state, action) => {
      state.coccygealJoint = state.coccygealJoint.filter(
        (_, index) => index !== action.payload
      );
    },

    // Remove a specific pointer from TJM
    clearTJM: (state, action) => {
      state.TJM = state.TJM.filter((_, index) => index !== action.payload);
    },

        // Remove a specific pointer from iliacJoint
    clearIliacJoint: (state, action) => {
      state.iliacJoint = state.iliacJoint.filter((_, index) => index !== action.payload);
    },

    

    resetState: () => {
      return initialState;
    },
  },
});

export const {
  updateAnkleAndFoot,
  updateShoulder,
  updateCervicalSpineAndNeckFinal,
  updateKneeAndThigh,
  updateLumbarSpineFinal1,
  updateLumbarSpineFinal2,
  updateHipAndThigh,
  updateElbowAndForearm,
  updateDorsalSpine,
  updateTJM,
  updateCoccygealJoint,
  updateIliacJoint,
  clearAnkleAndFoot,
  clearShoulder,
  clearCervicalSpineAndNeckFinal,
  clearKneeAndThigh,
  clearLumbarSpineFinal1,
  clearLumbarSpineFinal2,
  clearHipAndThigh,
  clearElbowAndForearm,
  clearDorsalSpine,
  clearTJM,
  clearCoccygealJoint,
  clearIliacJoint,
  resetState,
} = pointerSlice.actions;
export default pointerSlice.reducer;
