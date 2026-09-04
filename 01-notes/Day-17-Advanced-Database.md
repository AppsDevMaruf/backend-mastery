# Day 17 — Advanced Database

## Learning goals

- Offset pagination
- Numeric range filtering
- Safe dynamic sorting
- TypeORM QueryBuilder
- Pagination metadata
- Composite database indexes
- PostgreSQL query-plan analysis

## Pagination

Large result sets should not be returned in one response. The client sends a
page number and page size:

```http
GET /incomes?page=2&limit=5
```

The number of rows to skip is:

```ts
const skip = (page - 1) * limit;
```

TypeORM applies it with:

```ts
queryBuilder.skip(skip).take(limit);
```

## Filtering

The income endpoint accepts an optional range:

```http
GET /incomes?minIncome=50000&maxIncome=100000
```

Optional numeric values are checked against `undefined`, rather than by
truthiness, because zero is a valid value.

```ts
if (minIncome !== undefined) {
  queryBuilder.andWhere('income.totalIncome >= :minIncome', { minIncome });
}
```

Values are passed as query parameters instead of being concatenated into SQL.
This keeps the values separate from the SQL statement.

## Sorting

Example:

```http
GET /incomes?sortBy=totalIncome&sortOrder=DESC
```

Allowed columns and directions are validated in `QueryIncomeDto`:

```ts
@IsIn(['id', 'annualIncome', 'bonus', 'totalIncome'])
sortBy: 'id' | 'annualIncome' | 'bonus' | 'totalIncome' = 'id';

@IsIn(['ASC', 'DESC'])
sortOrder: 'ASC' | 'DESC' = 'DESC';
```

The whitelist is important because SQL identifiers such as column names cannot
be protected with value-parameter binding in the same way as filter values.

## Paginated response

`getManyAndCount()` returns the current page and the total number of matching
records:

```ts
const [data, total] = await queryBuilder.getManyAndCount();
```

The API returns useful navigation metadata:

```json
{
  "data": [],
  "meta": {
    "total": 23,
    "page": 2,
    "limit": 5,
    "totalPages": 5
  }
}
```

## Composite index

The most common query first filters by user and then filters or sorts by total
income. The migration therefore creates this B-tree index:

```sql
CREATE INDEX "IDX_incomes_user_total_income"
ON "incomes" ("user_id", "total_income");
```

Column order matters. `user_id` comes first because every own-income query has
an equality condition on that column.

## EXPLAIN ANALYZE result

The test table contained only 31 rows. PostgreSQL selected a sequential scan:

```text
Seq Scan on incomes
```

This is not an index failure. For a very small table, reading all rows is often
cheaper than traversing an index and then fetching table rows. PostgreSQL uses
statistics and estimated cost to choose a plan.

Observed sort strategies:

- `quicksort` when all matching rows fit within the requested limit.
- `top-N heapsort` when PostgreSQL only needs the highest few rows.

The index was verified in `pg_indexes` as:

```text
IDX_incomes_user_total_income
CREATE INDEX ... USING btree (user_id, total_income)
```

## Key lesson

Creating an index does not force PostgreSQL to use it. An index gives the query
planner another possible access path; the planner still chooses the estimated
cheapest plan for the current table size and data distribution.
