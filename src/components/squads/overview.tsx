import { PressureGraph } from "./pressure-graph";
import { StatusLabel } from "./status-label";
import { TimeAndPressure } from "./time-and-pressure";

export const SquadsOverview = () => {
  return (
    <section className="h-full flex overflow-x-auto gap-8 p-8">
      {data.squads.map((squad) => (
        <div
          key={squad.id}
          className="w-96 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-white text-xl font-bold">{squad.radioId}</h2>
            <StatusLabel status={squad.status} />
          </div>
          <TimeAndPressure
            startTime={squad.startTime}
            initialPressures={squad.members.map(
              (member) => member.initialPressure
            )}
          />
          <PressureGraph
            initialPressures={squad.members.map(
              (member) => member.initialPressure
            )}
          />
        </div>
      ))}
      <button className="w-96 cursor-pointer bg-gray-900/25 hover:bg-gray-900/50 border border-gray-900 hover:border-gray-800 rounded-2xl flex flex-col items-center justify-center">
        <h2 className="">Trupp hinzufügen</h2>
      </button>
    </section>
  );
};

const data = {
  squads: [
    {
      id: "squad-1",
      safetyTeam: false,
      status: {
        id: "active",
        label: "Im Einsatz",
      },
      radioId: "Trupp 1",
      radioFrequency: {
        label: "DMO 311",
        tag: "Standard",
      },
      members: [
        {
          name: "Lukas Brunkhorst",
          organization: "Feuerwehr Oerel",
          leader: true,
          equipmentId: "1",
          initialPressure: {
            value: 190,
            timestamp: new Date("2025-12-05T21:58:21+01:00"),
          },
        },
        {
          name: "Niklas Pape",
          organization: "Feuerwehr Oerel",
          leader: false,
          equipmentId: "5",
          initialPressure: {
            value: 200,
            timestamp: new Date("2025-12-05T21:59:04+01:00"),
          },
        },
      ],
      startTime: new Date("2025-12-05T22:00:14+01:00"),
    },
    {
      id: "squad-2",
      safetyTeam: true,
      status: {
        id: "standby",
        label: "In Bereitstellung",
      },
      radioId: "Trupp 2",
      radioFrequency: {
        label: "DMO 311",
        tag: "Standard",
      },
      members: [
        {
          name: "Nicolai Breden",
          organization: "Feuerwehr Barchel",
          leader: true,
          equipmentId: "3",
          initialPressure: {
            value: 290,
            timestamp: new Date("2025-12-05T22:04:07+01:00"),
          },
        },
        {
          name: "Fabian Lau",
          organization: "Feuerwehr Barchel",
          leader: false,
          equipmentId: "1",
          initialPressure: {
            value: 290,
            timestamp: new Date("2025-12-05T22:04:32+01:00"),
          },
        },
      ],
      startTime: null,
    },
  ],
};
