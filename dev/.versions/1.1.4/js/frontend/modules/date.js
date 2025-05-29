/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2024 Daan van den Bergh.
 */

// The date class (copy of vlib).
vweb.Date = class D extends Date {
    
    // Constructor.
    constructor(...args) {
        super(...args);
    }

    // Format.
    format(format) {
        let formatted = "";
        for (let i = 0; i < format.length; i++) {
            if (format[i] === "%") {
                switch (format[i + 1]) {
                    // %% : a literal %.
                    case '%':
                        formatted += "%";
                        ++i;
                        break;

                    // %a : locale’s abbreviated weekday name (e.g., Sun).
                    case 'a':
                        formatted += new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(this);
                        ++i;
                        break;

                    // %A : locale’s full weekday name (e.g., Sunday).
                    case 'A':
                        formatted += new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(this);
                        ++i;
                        break;

                    // %b : locale’s abbreviated month name (e.g., Jan); same as %h.
                    // %h : locale’s abbreviated month name (e.g., Jan); same as %b.
                    case 'b':
                    case 'h':
                        formatted += new Intl.DateTimeFormat('en-US', { month: 'short' }).format(this);
                        ++i;
                        break;

                    // %B : locale’s full month name (e.g., January).
                    case 'B':
                        formatted += new Intl.DateTimeFormat('en-US', { month: 'long' }).format(this);
                        ++i;
                        break;

                    // %C : century; like %Y, except omit last two digits (e.g., 21).
                    case 'C':
                        formatted += Math.floor(this.getFullYear() / 100);
                        ++i;
                        break;

                    // %d : day of month (e.g, 01).
                    case 'd':
                        formatted += String(this.getDate()).padStart(2, '0');
                        ++i;
                        break;

                    // %e : day of month, space padded; same as %_d.
                    case 'e':
                        formatted += String(this.getDate());
                        ++i;
                        break;

                    // %D : date; same as %m/%d/%y.
                    case 'D':
                        formatted += this.format("%m/%d/%y");
                        ++i;
                        break;

                    // %F : full date; same as %Y-%m-%d.
                    case 'F':
                        formatted += this.format("%Y-%m-%d");
                        ++i;
                        break;

                    // %H : hour (00..23).
                    case 'H':
                        formatted += String(this.getHours()).padStart(2, '0');
                        ++i;
                        break;

                    // %I : hour (01..12).
                    case 'I':
                        formatted += String((this.getHours() % 12) || 12).padStart(2, '0');
                        ++i;
                        break;

                    // %j : day of year (001..366) .
                    case 'j':
                        formatted += String(
                            Math.floor((this - new Date(this.getFullYear(), 0, 0)) / (86400 * 1000))
                        ).padStart(3, '0');
                        ++i;
                        break;

                    // %k : hour (0..23).
                    case 'k':
                        formatted += String(this.getHours());
                        ++i;
                        break;

                    // %l : hour ( 1..12) .
                    case 'l':
                        formatted += String((this.getHours() % 12) || 12);
                        ++i;
                        break;

                    // %m : month (01..12).
                    case 'm':
                        formatted += String(this.getMonth() + 1).padStart(2, '0');
                        ++i;
                        break;

                    // %M : minute (00..59).
                    case 'M':
                        formatted += String(this.getMinutes()).padStart(2, '0');
                        ++i;
                        break;

                    // %n : a newline.
                    case 'n':
                        formatted += "\n";
                        ++i;
                        break;

                    // %XN : milliseconds (X: 1..3) (0..9) (00..99) (000..999).
                    case 'N':
                        formatted += String(this.getMilliseconds()).padStart(Number(format[i + 2]) || 3, '0');
                        i += 2;
                        break;

                    // %p : locale’s equivalent of either AM or PM.
                    case 'p':
                        formatted += new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: true }).format(this);
                        ++i;
                        break;

                    // %P : like %p, but lower case.
                    case 'P':
                        formatted += new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: true }).format(this).toLowerCase();
                        ++i;
                        break;

                    // %r : locale’s 12-hour clock time (e.g., 11:11:04 PM).
                    case 'r':
                        formatted += this.format("%I:%M:%S %p");
                        ++i;
                        break;

                    // %R : 24-hour hour and minute; same as %H:%M.
                    case 'R':
                        formatted += this.format("%H:%M");
                        ++i;
                        break;

                    // %s : seconds since 1970-01-01 00:00:00 UTC.
                    case 's':
                        formatted += Math.floor(this.getTime() / 1000);
                        ++i;
                        break;

                    // %S : second (00..60).
                    case 'S':
                        formatted += String(this.getSeconds()).padStart(2, '0');
                        ++i;
                        break;

                    // %t : a tab.
                    case 't':
                        formatted += "\t";
                        ++i;
                        break;

                    // %T : time; same as %H:%M:%S.
                    case 'T':
                        formatted += this.format("%H:%M:%S");
                        ++i;
                        break;

                    // %u : day of week (1..7); 1 is Monday.
                    case 'u':
                        formatted += this.getDay() || 7;
                        ++i;
                        break;

                    // %U : week number of year, with Sunday as first day of week (00..53).
                    case 'U':
                        formatted += String(
                            Math.ceil((this - new Date(this.getFullYear(), 0, 1)) / (86400 * 1000) + 1) / 7
                        ).padStart(2, '0');
                        ++i;
                        break;

                    // %V : ISO week number, with Monday as first day of week (01..53).
                    case 'V':
                        const jan4 = new Date(this.getFullYear(), 0, 4);
                        const startOfWeek = new Date(this.getFullYear(), 0, 1);
                        const daysSinceJan4 = Math.floor((this - jan4) / (86400 * 1000));
                        const weekNumber = Math.ceil((daysSinceJan4 + jan4.getDay() + 1) / 7);
                        formatted += String(weekNumber).padStart(2, '0');
                        ++i;
                        break;

                    // %w : day of week (0..6); 0 is Sunday.
                    case 'w':
                        formatted += this.getDay();
                        ++i;
                        break;

                    // %W : week number of year, with Monday as first day of week (00..53).
                    case 'W':
                        formatted += String(
                            Math.floor((this - new Date(this.getFullYear(), 0, 1)) / (86400 * 1000) + 1) / 7
                        ).padStart(2, '0');
                        ++i;
                        break;

                    // %x : locale’s date representation (e.g., 12/31/99).
                    case 'x':
                        formatted += new Intl.DateTimeFormat('en-US').format(this);
                        ++i;
                        break;

                    // %X : locale’s time representation (e.g., 23:13:48).
                    case 'X':
                        formatted += new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(this);
                        ++i;
                        break;

                    // %y : last two digits of year (00..99).
                    case 'y':
                        formatted += String(this.getFullYear()).slice(-2);
                        ++i;
                        break;

                    // %Y : Full year.
                    case 'Y':
                        formatted += String(this.getFullYear());
                        ++i;
                        break;

                    // %z : +hhmm numeric timezone (e.g., -0400).
                    // %:z : +hh:mm numeric timezone (e.g., -04:00)
                    // %::z : +hh:mm:ss numeric time zone (e.g., -04:00:00).
                    // %:::z : numeric time zone with : to necessary precision (e.g., -04, +05:30).
                    case ':':
                    case 'z':
                        const timezoneOffset = this.getTimezoneOffset();
                        const sign = timezoneOffset > 0 ? '-' : '+';
                        const hours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
                        const minutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
                            
                        if (format[i + 1] === "z") {
                            formatted += `${sign}${hours}${minutes}`;
                            i += 1;
                        }
                        else if (format[i + 2] === "z") {
                            formatted += `${sign}${hours}:${minutes}`;
                            i += 2;
                        }
                        else if (format[i + 3] === "z") {
                            formatted += `${sign}${hours}:${minutes}:${this.format('XN')}`;
                            i += 3;
                        }
                        else if (format[i + 4] === "z") {
                            formatted += `${sign}${hours}:${minutes}:${this.format('XN').slice(0, 2)}`;
                            i += 4;
                        }
                        break;

                    // %Z : alphabetic time zone abbreviation (e.g., EDT).
                    case 'Z':
                        formatted += Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).format(this);
                        ++i;
                        break;

                    // Unknown.
                    default:
                        formatted += format[i];
                        break;
                }
            } else {
                formatted += format[i];
            }
        }
        return formatted;
    }

    // Milliseconds
    msec() { return this.getTime(); }

    // Seconds
    sec() { return parseInt(this.getTime() / 1000); }

    // Hour start.
    hour_start() {
        const date = new D(this.getTime())
        date.setMinutes(0, 0, 0);
        return date;
    }

    // Day start.
    day_start() {
        const date = new D(this.getTime())
        date.setHours(0, 0, 0, 0);
        return date;
    }

    // Day start.
    day_start() {
        const date = new D(this.getTime())
        date.setHours(0, 0, 0, 0);
        return date;
    }

    // Month start.
    week_start(sunday_start = true) {
        const diff = (this.getDay() + 7 - (sunday_start ? 0 : 1)) % 7;
        const date = new D(this.getTime())
        date.setDate(this.getDate() - diff)
        date.setHours(0, 0, 0, 0);;
        return date;
    }

    // Month start.
    month_start() {
        const date = new D(this.getTime())
        date.setDate(1)
        date.setHours(0, 0, 0, 0, 0);
        return date;
    }

    // Quarter year start.
    quarter_year_start() {
        const date = new D(this.getTime())
        const month = date.getMonth()+1;
        if (month > 9) {
            date.setMonth(9 - 1, 1)
            date.setHours(0, 0, 0, 0, 0);
        } else if (month > 6) {
            date.setMonth(6 - 1, 1)
            date.setHours(0, 0, 0, 0, 0);
        } else if (month > 3) {
            date.setMonth(3 - 1, 1)
            date.setHours(0, 0, 0, 0, 0);
        } else {
            date.setMonth(0, 1)
            date.setHours(0, 0, 0, 0, 0);
        }
        return date;
    }

    // Half year start.
    half_year_start() {
        const date = new D(this.getTime())
        if (date.getMonth() + 1 > 6) {
            date.setMonth(5, 1)
            date.setHours(0, 0, 0, 0, 0);
        } else {
            date.setMonth(0, 1)
            date.setHours(0, 0, 0, 0, 0);
        }
        return date;
    }

    // Year start.
    year_start() {
        const date = new D(this.getTime())
        date.setMonth(0, 1)
        date.setHours(0, 0, 0, 0, 0);
        return date;
    }
}