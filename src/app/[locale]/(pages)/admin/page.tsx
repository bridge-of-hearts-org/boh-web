import { redirect } from "next/navigation";

import { getServerAuth } from "@/lib/auth";
import AdminActions from "./AdminActions";
import { fetchAllFacilities } from "@/app/actions/data";
import { DirectoryFilterType, emptyFilter } from "@/utils/defines";
import Link from "next/link";

export default async function AdminDashboard() {
    const session = await getServerAuth();

    if (!session) {
        redirect("/admin/login");
    }

    const activeFilters: DirectoryFilterType = emptyFilter;

    const [facilities, totalCount] = await fetchAllFacilities(
        activeFilters,
        "name",
        1,
        400,
    );

    /* Smaller text and padding on phones, where the District column is
       hidden to make room */
    const tableHeadingStyle = "px-2 py-2 text-left md:px-4 md:py-3";
    const tableCellStyle = "px-2 py-1";
    const districtColumnStyle = "hidden md:table-cell";

    return (
        <div className="flex flex-col items-center gap-5">
            <h1 className="flex justify-center text-2xl font-semibold">
                Admin Dashboard
            </h1>
            <AdminActions />

            <table className="mt-8 w-full rounded-3xl text-sm md:text-base lg:w-2/3">
                <tbody>
                    <tr className="bg-orange-100">
                        <th className={tableHeadingStyle}>Name</th>
                        <th className={tableHeadingStyle}>City</th>
                        <th
                            className={`${tableHeadingStyle} ${districtColumnStyle}`}
                        >
                            District
                        </th>
                        <th className={tableHeadingStyle}>Province</th>
                    </tr>
                    {facilities.map((facility, idx) => {
                        return (
                            <tr
                                key={facility.id}
                                className="border hover:bg-orange-50 hover:font-semibold"
                            >
                                <td className={tableCellStyle}>
                                    <Link
                                        href={`/facility/edit/${facility.slug}`}
                                    >
                                        {facility.name}
                                    </Link>
                                </td>
                                <td className={tableCellStyle}>
                                    {facility.location.city}
                                </td>
                                <td
                                    className={`${tableCellStyle} ${districtColumnStyle}`}
                                >
                                    {facility.location.district}
                                </td>
                                <td className={tableCellStyle}>
                                    {facility.location.province}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
