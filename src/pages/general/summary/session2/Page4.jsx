import formatDateToDDMMYYYY from "../../../../utilities/formatter";

function Page4({ treatmentTracker, page4Ref }) {
  // Filter out empty records (no meaningful data)
  const filteredTracker =
    treatmentTracker?.filter(
      (val) =>
        val.Date ||
        val.VAS_score ||
        val.presentComplaints ||
        val.treatmentProtocol ||
        val.homeAdvice ||
        val.flag
    ) || [];

  // Check if filtered data is available
  const hasTreatmentData = filteredTracker.length > 0;

  return (
    <div ref={page4Ref} className="p-5 flex flex-col w-full gap-5 text-slate-700 ">
      <div className="w-full">
        <h1 className="text-2xl font-bold text-slate-800  mb-6">
          Treatment Summary
        </h1>

        {!hasTreatmentData ? (
          <p className="text-slate-500 ">No treatment records found.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredTracker.map((val, index) => (
              <div key={index} className="border-b border-slate-200  pb-4 last:border-0">
                <div className="flex justify-between mb-2">
                  {val.Date && (
                    <p className="text-lg font-semibold text-slate-800 ">
                      Date: {formatDateToDDMMYYYY(val.Date)}
                    </p>
                  )}
                </div>

                {(val.VAS_score ||
                  val.presentComplaints ||
                  val.treatmentProtocol ||
                  val.homeAdvice ||
                  val.flag) && (
                    <table className="w-full text-sm text-slate-700 ">
                      <tbody>
                        {val.VAS_score && (
                          <tr>
                            <td className="font-bold w-1/4 py-1 text-slate-800 ">VAS Score</td>
                            <td className="py-1 capitalize">: {val.VAS_score}</td>
                          </tr>
                        )}
                        {val.presentComplaints && (
                          <tr>
                            <td className="font-bold py-1 text-slate-800 ">Present Complaints</td>
                            <td className="py-1 capitalize">
                              : {val.presentComplaints}
                            </td>
                          </tr>
                        )}
                        {val.treatmentProtocol && (
                          <tr>
                            <td className="font-bold py-1 text-slate-800 ">Treatment</td>
                            <td className="py-1 capitalize">
                              : {val.treatmentProtocol}
                            </td>
                          </tr>
                        )}
                        {val.homeAdvice && (
                          <tr>
                            <td className="font-bold py-1 text-slate-800 ">Home Advice</td>
                            <td className="py-1 capitalize">
                              : {val.homeAdvice}
                            </td>
                          </tr>
                        )}
                        {val.flag && (
                          <tr>
                            <td className="font-bold py-1 text-slate-800 ">Flag</td>
                            <td className="py-1 capitalize">: {val.flag}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page4;
