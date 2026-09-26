import { SortByDefaultEnum } from 'src/common/constants/query.constant';
import { SelectQueryBuilder } from 'typeorm';

export const QueryHelper = async (
  from_date: string,
  to_date: string,
  sort_by: SortByDefaultEnum,
  search_text: string,
  searchFields: string[],
  type: string,
  query: SelectQueryBuilder<any>,
): Promise<{ count: number; newQuery: SelectQueryBuilder<any> }> => {
  // Parse the from_date and to_date into proper Date objects
  const fromDate = from_date ? new Date(from_date) : null;
  const toDate = to_date
    ? new Date(new Date(to_date).setHours(23, 59, 59, 999))
    : null;

  // Apply date range filters to the query
  if (fromDate) {
    query.andWhere(`${type}.created_at >= :fromDate`, { fromDate });
  }
  if (toDate) {
    query.andWhere(`${type}.created_at <= :toDate`, { toDate });
  }

  // Apply search text filter
  // if (search_text) {
  //   query.andWhere(
  //     `(${type}.first_name ILIKE :text OR ${type}.last_name ILIKE :text OR ${type}.email ILIKE :text)`,
  //     { text: `%${search_text}%` },
  //   );
  // }
  // Apply search text filter for multiple fields
  if (search_text && searchFields.length > 0) {
    const searchConditions = searchFields
      .map((field) => `${type}.${field} ILIKE :text`)
      .join(' OR ');
    query.andWhere(`(${searchConditions})`, { text: `%${search_text}%` });
  }

  // Apply sorting based on the sort_by parameter
  switch (sort_by) {
    case SortByDefaultEnum.NEWEST:
      query.orderBy(`${type}.created_at`, 'DESC');
      break;
    case SortByDefaultEnum.OLDEST:
      query.orderBy(`${type}.created_at`, 'ASC');
      break;
    default:
      query.orderBy(`${type}.created_at`, 'DESC'); // Default sorting, e.g., newest
      break;
  }

  // Get the total count of records
  const count = await query.getCount();

  return { count, newQuery: query };
};
