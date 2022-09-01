import Link from "next/link";
import Image from "next/image";
import formatTimestamp from "../utils/formatTimestamp";

export default function EventCard({ id, name, imageURL }) {
  return (
    <div className="group relative clickable-card rounded-lg">
      <Link href={`/circle/${id}`}>
        <a className="clickable-card__link"></a>
      </Link>
      <div className="circle-index-view block w-full aspect-w-10 aspect-h-7 mr-0 ml-0 rounded-full bg-gray-100 overflow-hidden relative group-hover:opacity-75 mb-6">
        {imageURL && <Image src={imageURL} alt="event image" layout="fill" />}
      </div>
      <p className="mt-2 block text-sm text-gray-500"></p>
      <p className="block text-base text-center pr-8 font-medium text-gray-900">
        {name}
      </p>
    </div>
  );
}
