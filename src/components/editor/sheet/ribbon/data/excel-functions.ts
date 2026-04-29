export interface ExcelFunction {
  name: string;
  category: FunctionCategory;
  signature: string;
  description: string;
}

export type FunctionCategory =
  | "Financial"
  | "Logical"
  | "Text"
  | "Date & Time"
  | "Lookup & Reference"
  | "Math & Trig"
  | "Statistical";

export const FUNCTION_CATEGORIES: FunctionCategory[] = [
  "Financial",
  "Logical",
  "Text",
  "Date & Time",
  "Lookup & Reference",
  "Math & Trig",
  "Statistical",
];

export const EXCEL_FUNCTIONS: ExcelFunction[] = [
  // ─── Financial ──────────────────────────────────────────────────────────
  { name: "PMT", category: "Financial", signature: "PMT(rate, nper, pv, [fv], [type])", description: "Calculates the payment for a loan based on constant payments and a constant interest rate" },
  { name: "FV", category: "Financial", signature: "FV(rate, nper, pmt, [pv], [type])", description: "Returns the future value of an investment" },
  { name: "PV", category: "Financial", signature: "PV(rate, nper, pmt, [fv], [type])", description: "Returns the present value of an investment" },
  { name: "NPV", category: "Financial", signature: "NPV(rate, value1, [value2], ...)", description: "Returns the net present value of an investment based on a discount rate and a series of future payments" },
  { name: "IRR", category: "Financial", signature: "IRR(values, [guess])", description: "Returns the internal rate of return for a series of cash flows" },
  { name: "RATE", category: "Financial", signature: "RATE(nper, pmt, pv, [fv], [type], [guess])", description: "Returns the interest rate per period of an annuity" },
  { name: "NPER", category: "Financial", signature: "NPER(rate, pmt, pv, [fv], [type])", description: "Returns the number of periods for an investment" },
  { name: "SLN", category: "Financial", signature: "SLN(cost, salvage, life)", description: "Returns the straight-line depreciation of an asset for one period" },

  // ─── Logical ────────────────────────────────────────────────────────────
  { name: "IF", category: "Logical", signature: "IF(logical_test, value_if_true, [value_if_false])", description: "Returns one value if a condition is TRUE and another if FALSE" },
  { name: "IFS", category: "Logical", signature: "IFS(logical_test1, value1, [logical_test2, value2], ...)", description: "Checks multiple conditions and returns the value for the first TRUE condition" },
  { name: "AND", category: "Logical", signature: "AND(logical1, [logical2], ...)", description: "Returns TRUE if all arguments are TRUE" },
  { name: "OR", category: "Logical", signature: "OR(logical1, [logical2], ...)", description: "Returns TRUE if any argument is TRUE" },
  { name: "NOT", category: "Logical", signature: "NOT(logical)", description: "Reverses the logic of its argument" },
  { name: "XOR", category: "Logical", signature: "XOR(logical1, [logical2], ...)", description: "Returns TRUE if an odd number of arguments are TRUE" },
  { name: "IFERROR", category: "Logical", signature: "IFERROR(value, value_if_error)", description: "Returns value_if_error if expression is an error, otherwise returns the expression value" },
  { name: "IFNA", category: "Logical", signature: "IFNA(value, value_if_na)", description: "Returns value_if_na if expression is #N/A, otherwise returns the expression value" },
  { name: "SWITCH", category: "Logical", signature: "SWITCH(expression, value1, result1, [value2, result2], ..., [default])", description: "Evaluates an expression against a list of values and returns the corresponding result" },

  // ─── Text ───────────────────────────────────────────────────────────────
  { name: "CONCAT", category: "Text", signature: "CONCAT(text1, [text2], ...)", description: "Joins multiple text strings into one string" },
  { name: "TEXTJOIN", category: "Text", signature: "TEXTJOIN(delimiter, ignore_empty, text1, [text2], ...)", description: "Joins text with a delimiter between each value" },
  { name: "LEFT", category: "Text", signature: "LEFT(text, [num_chars])", description: "Returns the leftmost characters from a text value" },
  { name: "RIGHT", category: "Text", signature: "RIGHT(text, [num_chars])", description: "Returns the rightmost characters from a text value" },
  { name: "MID", category: "Text", signature: "MID(text, start_num, num_chars)", description: "Returns a specific number of characters from a text string" },
  { name: "LEN", category: "Text", signature: "LEN(text)", description: "Returns the number of characters in a text string" },
  { name: "LOWER", category: "Text", signature: "LOWER(text)", description: "Converts text to lowercase" },
  { name: "UPPER", category: "Text", signature: "UPPER(text)", description: "Converts text to uppercase" },
  { name: "PROPER", category: "Text", signature: "PROPER(text)", description: "Capitalizes the first letter of each word" },
  { name: "TRIM", category: "Text", signature: "TRIM(text)", description: "Removes extra spaces from text" },
  { name: "SUBSTITUTE", category: "Text", signature: "SUBSTITUTE(text, old_text, new_text, [instance_num])", description: "Replaces existing text with new text in a string" },
  { name: "REPLACE", category: "Text", signature: "REPLACE(old_text, start_num, num_chars, new_text)", description: "Replaces characters within text" },
  { name: "FIND", category: "Text", signature: "FIND(find_text, within_text, [start_num])", description: "Finds one text value within another (case-sensitive)" },
  { name: "SEARCH", category: "Text", signature: "SEARCH(find_text, within_text, [start_num])", description: "Finds one text value within another (case-insensitive)" },

  // ─── Date & Time ────────────────────────────────────────────────────────
  { name: "TODAY", category: "Date & Time", signature: "TODAY()", description: "Returns the current date" },
  { name: "NOW", category: "Date & Time", signature: "NOW()", description: "Returns the current date and time" },
  { name: "DATE", category: "Date & Time", signature: "DATE(year, month, day)", description: "Creates a date from year, month, and day components" },
  { name: "YEAR", category: "Date & Time", signature: "YEAR(serial_number)", description: "Returns the year of a date" },
  { name: "MONTH", category: "Date & Time", signature: "MONTH(serial_number)", description: "Returns the month of a date (1-12)" },
  { name: "DAY", category: "Date & Time", signature: "DAY(serial_number)", description: "Returns the day of a date (1-31)" },
  { name: "WEEKDAY", category: "Date & Time", signature: "WEEKDAY(serial_number, [return_type])", description: "Returns the day of the week" },
  { name: "DATEDIF", category: "Date & Time", signature: "DATEDIF(start_date, end_date, unit)", description: "Calculates the number of days, months, or years between two dates" },
  { name: "EOMONTH", category: "Date & Time", signature: "EOMONTH(start_date, months)", description: "Returns the last day of the month, a given number of months away" },
  { name: "NETWORKDAYS", category: "Date & Time", signature: "NETWORKDAYS(start_date, end_date, [holidays])", description: "Returns the number of working days between two dates" },
  { name: "WORKDAY", category: "Date & Time", signature: "WORKDAY(start_date, days, [holidays])", description: "Returns a date that is a given number of working days away" },

  // ─── Lookup & Reference ─────────────────────────────────────────────────
  { name: "VLOOKUP", category: "Lookup & Reference", signature: "VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])", description: "Looks up a value in the first column and returns a value in the same row from another column" },
  { name: "HLOOKUP", category: "Lookup & Reference", signature: "HLOOKUP(lookup_value, table_array, row_index_num, [range_lookup])", description: "Looks up a value in the first row and returns a value in the same column from another row" },
  { name: "XLOOKUP", category: "Lookup & Reference", signature: "XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])", description: "Searches a range and returns a corresponding item" },
  { name: "INDEX", category: "Lookup & Reference", signature: "INDEX(array, row_num, [column_num])", description: "Returns a value from a specific position in a range" },
  { name: "MATCH", category: "Lookup & Reference", signature: "MATCH(lookup_value, lookup_array, [match_type])", description: "Returns the position of a value in a range" },
  { name: "OFFSET", category: "Lookup & Reference", signature: "OFFSET(reference, rows, cols, [height], [width])", description: "Returns a reference offset from a given reference" },
  { name: "INDIRECT", category: "Lookup & Reference", signature: "INDIRECT(ref_text, [a1])", description: "Returns the reference specified by a text string" },
  { name: "CHOOSE", category: "Lookup & Reference", signature: "CHOOSE(index_num, value1, [value2], ...)", description: "Chooses a value from a list based on an index number" },

  // ─── Math & Trig ────────────────────────────────────────────────────────
  { name: "SUM", category: "Math & Trig", signature: "SUM(number1, [number2], ...)", description: "Adds all the numbers in a range" },
  { name: "SUMIF", category: "Math & Trig", signature: "SUMIF(range, criteria, [sum_range])", description: "Adds cells that meet a specified condition" },
  { name: "SUMIFS", category: "Math & Trig", signature: "SUMIFS(sum_range, criteria_range1, criteria1, ...)", description: "Adds cells that meet multiple conditions" },
  { name: "PRODUCT", category: "Math & Trig", signature: "PRODUCT(number1, [number2], ...)", description: "Multiplies all the numbers given as arguments" },
  { name: "MOD", category: "Math & Trig", signature: "MOD(number, divisor)", description: "Returns the remainder after division" },
  { name: "ROUND", category: "Math & Trig", signature: "ROUND(number, num_digits)", description: "Rounds a number to a specified number of digits" },
  { name: "ROUNDUP", category: "Math & Trig", signature: "ROUNDUP(number, num_digits)", description: "Rounds a number up, away from zero" },
  { name: "ROUNDDOWN", category: "Math & Trig", signature: "ROUNDDOWN(number, num_digits)", description: "Rounds a number down, toward zero" },
  { name: "INT", category: "Math & Trig", signature: "INT(number)", description: "Rounds a number down to the nearest integer" },
  { name: "ABS", category: "Math & Trig", signature: "ABS(number)", description: "Returns the absolute value of a number" },
  { name: "POWER", category: "Math & Trig", signature: "POWER(number, power)", description: "Returns the result of a number raised to a power" },
  { name: "SQRT", category: "Math & Trig", signature: "SQRT(number)", description: "Returns the positive square root of a number" },
  { name: "RAND", category: "Math & Trig", signature: "RAND()", description: "Returns a random number between 0 and 1" },
  { name: "RANDBETWEEN", category: "Math & Trig", signature: "RANDBETWEEN(bottom, top)", description: "Returns a random integer between two numbers" },

  // ─── Statistical ────────────────────────────────────────────────────────
  { name: "AVERAGE", category: "Statistical", signature: "AVERAGE(number1, [number2], ...)", description: "Returns the arithmetic mean of the arguments" },
  { name: "AVERAGEIF", category: "Statistical", signature: "AVERAGEIF(range, criteria, [average_range])", description: "Returns the average of cells that meet a condition" },
  { name: "COUNT", category: "Statistical", signature: "COUNT(value1, [value2], ...)", description: "Counts the number of cells that contain numbers" },
  { name: "COUNTA", category: "Statistical", signature: "COUNTA(value1, [value2], ...)", description: "Counts the number of non-empty cells" },
  { name: "COUNTIF", category: "Statistical", signature: "COUNTIF(range, criteria)", description: "Counts the number of cells that meet a condition" },
  { name: "COUNTIFS", category: "Statistical", signature: "COUNTIFS(criteria_range1, criteria1, ...)", description: "Counts cells that meet multiple conditions" },
  { name: "MAX", category: "Statistical", signature: "MAX(number1, [number2], ...)", description: "Returns the largest value in a set of values" },
  { name: "MIN", category: "Statistical", signature: "MIN(number1, [number2], ...)", description: "Returns the smallest value in a set of values" },
  { name: "MEDIAN", category: "Statistical", signature: "MEDIAN(number1, [number2], ...)", description: "Returns the median of the given numbers" },
  { name: "MODE", category: "Statistical", signature: "MODE(number1, [number2], ...)", description: "Returns the most frequently occurring value" },
  { name: "STDEV", category: "Statistical", signature: "STDEV(number1, [number2], ...)", description: "Estimates standard deviation based on a sample" },
  { name: "VAR", category: "Statistical", signature: "VAR(number1, [number2], ...)", description: "Estimates variance based on a sample" },
  { name: "RANK", category: "Statistical", signature: "RANK(number, ref, [order])", description: "Returns the rank of a number in a list" },
  { name: "PERCENTILE", category: "Statistical", signature: "PERCENTILE(array, k)", description: "Returns the k-th percentile of values in a range" },
];

/** Get functions filtered by category */
export function getFunctionsByCategory(category: FunctionCategory): ExcelFunction[] {
  return EXCEL_FUNCTIONS.filter((f) => f.category === category);
}
