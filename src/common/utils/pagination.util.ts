import { PAGINATION_CONSTANTS } from '../constants/query.constant';
import { IPagination } from '../interfaces/pagination.interface';

export function getLimitAndOffsetFromFindQuery(query): {
  limit: number;
  offset: number;
} {
  const limit = query.page_size
    ? parseInt(query.page_size)
    : PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE;
  const offset = query.page_no
    ? (parseInt(query.page_no) - 1) * limit
    : (PAGINATION_CONSTANTS.DEFAULT_PAGE_NO - 1) * limit;
  return { limit, offset };
}

export function getLimitAndOffsetFromListQuery(query): {
  limit: number;
  offset: number;
} {
  const limit = query.page_size
    ? parseInt(query.page_size)
    : PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE;
  const offset = query.page_no
    ? (parseInt(query.page_no) - 1) * limit
    : (PAGINATION_CONSTANTS.DEFAULT_PAGE_NO - 1) * limit;
  return { limit, offset };
}

export function getPaginationObject(limit, offset, total): IPagination {
  const page = offset / limit + 1;
  const page_size = limit;
  const page_count = Math.ceil(total / limit);
  return { page, page_size, page_count, total };
}

export function getSkipAndLimitFromQuery(query: any) {
  const limit: number = query.page_size
    ? parseInt(query.page_size)
    : PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE;
  const skip: number = query.page_no
    ? (parseInt(query.page_no) - 1) * limit
    : (PAGINATION_CONSTANTS.DEFAULT_PAGE_NO - 1) * limit;
  return { skip, limit };
}
