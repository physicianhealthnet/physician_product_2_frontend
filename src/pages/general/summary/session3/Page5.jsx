import { useParams } from "react-router-dom";

function Page5({ exerciseSummary, page5Ref }) {

  // Check if data is available
  const hasExerciseData = exerciseSummary && exerciseSummary.length > 0;

  return (
    <div
      ref={page5Ref}
      className="p-5 flex flex-col w-full gap-5 text-slate-700 "
    >
      <div className="w-full leading-relaxed">
        <h1 className="text-2xl font-bold text-slate-800  mb-6">
          Exercise Summary
        </h1>

        {!hasExerciseData ? (
          <p className="text-slate-500 ">No exercise records found.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {exerciseSummary.map((val, index) => {
              // Check if this exercise has any data
              const hasExerciseFields = val.name_of_exercise || val.exercise_cat || val.reps || val.sets || val.no_of_days;

              return hasExerciseFields ? (
                <div key={index} className="pb-4 border-b border-slate-200  last:border-0">
                  <p className="text-lg font-semibold text-slate-800  mb-2">
                    Exercise {index + 1}
                  </p>
                  <div className="grid grid-cols-2 gap-y-1 text-slate-700  text-sm">
                    {val.name_of_exercise && (
                      <p>
                        <span className="w-48 inline-block font-bold text-slate-800 ">
                          Name of Exercise
                        </span>
                        : <span className="capitalize">{val.name_of_exercise}</span>
                      </p>
                    )}
                    {val.exercise_cat && (
                      <p>
                        <span className="w-48 inline-block font-bold text-slate-800 ">
                          Exercise Category
                        </span>
                        : <span className="capitalize">{val.exercise_cat}</span>
                      </p>
                    )}
                    {val.reps && (
                      <p>
                        <span className="w-48 inline-block font-bold text-slate-800 ">Reps</span>:{" "}
                        {val.reps}
                      </p>
                    )}
                    {val.sets && (
                      <p>
                        <span className="w-48 inline-block font-bold text-slate-800 ">Sets</span>:{" "}
                        {val.sets}
                      </p>
                    )}
                    {val.no_of_days && (
                      <p>
                        <span className="w-48 inline-block font-bold text-slate-800 ">
                          No of Days
                        </span>
                        : {val.no_of_days}
                      </p>
                    )}
                  </div>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page5;