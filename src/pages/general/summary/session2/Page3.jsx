import React from "react";

function Page3({ page3Ref, allNotes }) {
  // Check if data is available
  const hasNotesData = allNotes && allNotes.length > 0;

  return (
    <div
      ref={page3Ref}
      className="p-5 flex flex-col w-full gap-5 text-slate-700 "
    >
      <div className="flex flex-row items-center justify-between">
        <h1 className="font-bold text-slate-800  text-2xl m-0">
          Treatment Attend & Progress
        </h1>
        <div className="flex flex-row gap-3 font-bold text-xl text-slate-600 ">
          <p className="m-0">Total Attend Days Counts:</p>
          <p className="m-0">{allNotes?.length || 0}</p>
        </div>
      </div>
      <hr className="border-slate-200 " />
      <div>
        {!hasNotesData ? (
          <p className="text-slate-500 ">No treatment notes found.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-200 ">
            {allNotes.map((note, index) => {
              // Check if this note has any data
              const hasNoteFields = note.sessionDate || note.sessionNotes;

              return hasNoteFields ? (
                <div key={index} className="py-4 first:pt-0 last:pb-0">
                  {note.sessionDate && (
                    <h2 className="font-semibold text-slate-800  text-xl mb-2">
                      Session Date: {new Date(note.sessionDate).toLocaleDateString()}
                    </h2>
                  )}
                  {note.sessionNotes && (
                    <p className="text-slate-600  whitespace-pre-wrap leading-relaxed">
                      {note.sessionNotes}
                    </p>
                  )}
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page3;