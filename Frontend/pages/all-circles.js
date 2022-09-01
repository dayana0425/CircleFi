import { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import Dashboard from "../components/Dashboard";
import EventCard from "../components/EventCard";

const UPCOMING_EVENTS = gql`
  query getCircles {
    savingCircles {
      id
      circleName
      frequency
      host
      imageURL
    }
  }
`;

export default function Home() {
  const [currentTimestamp, setEventTimestamp] = useState(
    new Date().getTime().toString()
  );
  const { loading, error, data } = useQuery(UPCOMING_EVENTS);

  if (loading)
    return (
      <Dashboard>
        <p>Loading...</p>
      </Dashboard>
    );
  if (error)
    return (
      <Dashboard>
        <p>`Error! ${error.message}`</p>
      </Dashboard>
    );

  return (
    // <Dashboard>
    <div className="max-w-7xl flex justify-center items-center mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap justify-start items-center py-8">
        {/* <DashboardNav page={page} /> */}
        <div className="sm:w-10/12 sm:pl-8">
          <h1 className="mb-8 text-2xl tracking-tight font-extrabold text-gray-900 sm:text-3xl md:text-4xl mt-8 mb-16">
            Circle Explorer
          </h1>
        </div>

        <ul
          role="list"
          className="grid grid-cols-2 gap-x-12 gap-y-16 grid-cols-5"
        >
          {data &&
            data.savingCircles.length > 0 &&
            data.savingCircles.map((event) => (
              <li key={event.id}>
                <EventCard
                  id={event.id}
                  name={event.circleName}
                  imageURL={event.imageURL}
                />
              </li>
            ))}
            {(data && data.savingCircles.length == 0) &&
            <div className="sm:w-10/12 sm:pl-8">
              <p>No Circles Have Been Created Yet.</p>
            </div>
            }
        </ul>
      </div>
    </div>
    // </Dashboard>
  );
}
