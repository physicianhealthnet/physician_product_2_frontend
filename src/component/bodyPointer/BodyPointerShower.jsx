import React from "react";
import bodyfront from "../../assets/body/human_layout_1.jpg";
import bodyback from "../../assets/body/human_layout_3.jpg";
import bodyleft from "../../assets/body/human_layout_2.jpg";
import bodyright from "../../assets/body/human_layout_3.jpg";

const BodyPointerShower = ({ patientFormData }) => {
    
  return (
    <div className="flex flex-row flex-wrap items-center justify-evenly w-full">
      <div className="flex flex-col justify-center items-center">
        <div>Back View</div>

        <div className="w-[200px] h-[400px] relative">
          <img
            src={bodyfront}
            alt="body"
            className="w-[200px] h-[400px] absolute"
          />
          <div className="w-[200px] h-[400px] absolute">
            {patientFormData?.a_jbodytouchpoint_back?.map((pos, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: pos.x - 5,
                  top: pos.y - 5,
                  width: "15px",
                  height: "15px",
                  backgroundColor: "red",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
                onClick={() => onRemovePointer(index)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center">
        <div>Left View</div>

        <div className="w-[200px] h-[400px] relative">
          <img
            src={bodyback}
            alt="body"
            className="w-[200px] h-[400px] absolute"
          />
          <div className="w-[200px] h-[400px] absolute">
            {patientFormData?.a_jbodytouchpoint_left?.map((pos, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: pos.x - 5,
                  top: pos.y - 5,
                  width: "15px",
                  height: "15px",
                  backgroundColor: "red",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
                onClick={() => onRemovePointer(index)} // Remove the clicked pointer
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center">
        <div>Front View</div>

        <div className="w-[200px] h-[400px] relative">
          <img
            src={bodyleft}
            alt="body"
            className="w-[200px] h-[400px] absolute"
          />
          <div className="w-[200px] h-[400px] absolute">
            {patientFormData?.a_jbodytouchpoint_front?.map((pos, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: pos.x - 5,
                  top: pos.y - 5,
                  width: "15px",
                  height: "15px",
                  backgroundColor: "red",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
                onClick={() => onRemovePointer(index)} // Remove the clicked pointer
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center">
        <div>Right View</div>

        <div className="w-[200px] h-[400px] relative">
          <img
            src={bodyright}
            alt="body"
            className="w-[200px] h-[400px] absolute scale-x-[-1]"
          />
          <div className="w-[200px] h-[400px] absolute">
            {patientFormData?.a_jbodytouchpoint_right?.map((pos, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: pos.x - 5,
                  top: pos.y - 5,
                  width: "15px",
                  height: "15px",
                  backgroundColor: "red",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
                onClick={() => onRemovePointer(index)} // Remove the clicked pointer
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyPointerShower;
