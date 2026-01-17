"use client";
import "./pagination.scss";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const Pagination = ({
  currentPage,
  totalPages,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const hasPrev = currentPage > 0;
  const hasNext = currentPage < totalPages - 1;

  const createPageUrl = (pageNumber) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="pagination_wrap mt-12 flex justify-between w-full items-center">
      <button
        className="cmnBtn"
        disabled={!hasPrev}
        onClick={() => createPageUrl(currentPage - 1)}
      >
        Previous
      </button>
      <span className="mx-4">Page {currentPage + 1} of {totalPages}</span>
      <button
        className="cmnBtn"
        disabled={!hasNext}
        onClick={() => createPageUrl(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;