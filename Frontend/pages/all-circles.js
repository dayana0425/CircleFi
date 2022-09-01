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
    <Dashboard>
      <ul
        role="list"
        className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
        { data && data.savingCircles.length > 0 && data.savingCircles.map((event) => (

            <li key={event.id}>
              <EventCard
                id={event.id}
                name={event.circleName}
                imageURL={event.imageURL}/> 
              
            </li>
          ))
        }
      </ul>
    </Dashboard>

  );
}