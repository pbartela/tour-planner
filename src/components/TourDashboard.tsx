import { QueryProvider } from "@/components/QueryProvider";
import { TourList } from "@/components/tours/TourList";

export const TourDashboard = () => {
	return (
		<QueryProvider>
			<TourList />
		</QueryProvider>
	);
};

export default TourDashboard;
