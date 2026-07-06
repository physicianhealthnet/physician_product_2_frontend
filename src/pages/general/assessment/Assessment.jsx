import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import { IoMdArrowRoundBack } from "react-icons/io";
import PhysicianAssessmentSheet from "./PhysicianAssessmentSheet";
import { AxiosInstance } from "../../../utilities/AxiosInstance";
import Button from "../../../component/ui/Button";

import { StaggerContainer, StaggerItem } from "../../../component/ui/Transitions";

const Assessment = () => {
  const navigate = useNavigate();
  const { patient_id } = useParams();

  return (
    <StaggerContainer>
      <div className="flex flex-col gap-6">
        <StaggerItem>
          <div className="flex justify-between items-center max-md:items-start max-md:mb-2 max-md:flex-col mb-4">
            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <IoMdArrowRoundBack /> Back
            </Button>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="flex flex-col gap-4">
            <PhysicianAssessmentSheet />
          </div>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
};

export default Assessment;
