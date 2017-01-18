/*
 * Copyright 2016 Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain a copy
 * of the license at https://github.com/palantir/blueprint/blob/master/LICENSE
 * and https://github.com/palantir/blueprint/blob/master/PATENTS
 */

import * as classNames from "classnames";
import * as moment from "moment";
import * as React from "react";

import {
    AbstractComponent,
    // Button,
    Classes,
    // InputGroup,
    // Intent,
    IProps,
    Popover,
    Position,
    // Utils,
} from "@blueprintjs/core";

import { DateRange/*, fromMomentToDate*/ } from "./common/dateUtils";
import {
    getDefaultMaxDate,
    getDefaultMinDate,
    IDatePickerBaseProps,
} from "./datePickerCore";
import { DateRangePicker, IDateRangeShortcut } from "./dateRangePicker";

export interface IDateRangeInputProps extends IDatePickerBaseProps, IProps {
    /**
     * Whether the start and end dates of the range can be the same day.
     * If `true`, clicking a selected date will create a one-day range.
     * If `false`, clicking a selected date will clear the selection.
     * @default false
     */
    allowSingleDayRange?: boolean;

    /**
     * Whether the component should be enabled or disabled.
     * @default false
     */
    disabled?: boolean;

    /**
     * Initial DateRange the calendar will display as selected.
     * This should not be set if `value` is set.
     */
    defaultValue?: DateRange;

    /**
     * The format of the date. See options
     * here: http://momentjs.com/docs/#/displaying/format/
     * @default "YYYY-MM-DD"
     */
    format?: string;

    /**
     * The error message to display when the date selected invalid.
     * @default "Invalid date"
     */
    invalidDateMessage?: string;

    /**
     * Called when the user selects a day.
     * If no days are selected, it will pass `[null, null]`.
     * If a start date is selected but not an end date, it will pass `[selectedDate, null]`.
     * If both a start and end date are selected, it will pass `[startDate, endDate]`.
     */
    onChange?: (selectedDates: DateRange) => void;

    /**
     * Called when the user finishes typing in a new date and the date causes an error state.
     * If the date is invalid, `new Date(undefined)` will be returned. If the date is out of range,
     * the out of range date will be returned (`onChange` is not called in this case).
     */
    onError?: (errorDate: Date) => void;

    /**
     * If true, the Popover will open when the user clicks on the input. If false, the Popover will only
     * open when the calendar icon is clicked.
     * @default true
     */
    openOnFocus?: boolean;

    /**
     * The error message to display when the date selected is out of range.
     * @default "Out of range"
     */
    outOfRangeMessage?: string;

    /**
     * The position the date popover should appear in relative to the input box.
     * @default Position.BOTTOM
     */
    popoverPosition?: Position;

    /**
     * Whether shortcuts to quickly select a range of dates are displayed or not.
     * If `true`, preset shortcuts will be displayed.
     * If `false`, no shortcuts will be displayed.
     * If an array, the custom shortcuts provided will be displayed.
     * @default true
     */
    shortcuts?: boolean | IDateRangeShortcut[];

    /**
     * The currently selected DateRange.
     * If this prop is present, the component acts in a controlled manner.
     */
    value?: DateRange;
}

export interface IDateRangeInputState {
    isOpen?: boolean;

    isStartDateInputFocused?: boolean;
    startDateValue?: moment.Moment;
    startDateValueString?: string;

    isEndDateInputFocused?: boolean;
    endDateValue?: moment.Moment;
    endDateValueString?: string;
}

export class DateRangeInput extends AbstractComponent<IDateRangeInputProps, IDateRangeInputState> {
    public static defaultProps: IDateRangeInputProps = {
        allowSingleDayRange: false,
        disabled: false,
        format: "YYYY-MM-DD",
        invalidDateMessage: "Invalid date",
        maxDate: getDefaultMaxDate(),
        minDate: getDefaultMinDate(),
        openOnFocus: true,
        outOfRangeMessage: "Out of range",
        popoverPosition: Position.BOTTOM_LEFT,
        shortcuts: true,
    };

    public displayName = "Blueprint.DateRangeInput";

    private startDateInputRef: HTMLElement = null;
    private endDateInputRef: HTMLElement = null;

    public constructor(props: IDateRangeInputProps, context?: any) {
        super(props, context);

        const [defaultStartDateValue, defaultEndDateValue] = this.getDefaultDateRange();

        const startDateValue = (this.props.value !== undefined && this.props.value[0] != null)
            ? this.fromDateToMoment(this.props.value[0])
            : defaultStartDateValue;

        const endDateValue = (this.props.value !== undefined && this.props.value[1] != null)
            ? this.fromDateToMoment(this.props.value[1])
            : defaultEndDateValue;

        this.state = {
            endDateValue,
            endDateValueString: null,
            isEndDateInputFocused: false,
            isOpen: false,
            isStartDateInputFocused: false,
            startDateValue,
            startDateValueString: null,
        };
    }

    public render() {
        const { format } = this.props;

        // Date strings

        const startDateString = (this.state.isStartDateInputFocused)
            ? this.state.startDateValueString
            : this.getDateStringForDisplay(this.state.startDateValue);

        const endDateString = (this.state.isEndDateInputFocused)
            ? this.state.endDateValueString
            : this.getDateStringForDisplay(this.state.endDateValue);

        // Date values

        const startDateValue = (this.state.isStartDateInputFocused)
            ? moment(this.state.startDateValueString, format)
            : this.state.startDateValue;

        const endDateValue = (this.state.isEndDateInputFocused)
            ? moment(this.state.endDateValueString, format)
            : this.state.endDateValue;

        // Placeholders

        const startDatePlaceholder = (this.state.isStartDateInputFocused)
            ? moment(this.props.minDate).format(format)
            : "Start date";

        const endDatePlaceholder = (this.state.isEndDateInputFocused)
            ? moment(this.props.maxDate).format(format)
            : "End date";

        // Classes

        const startDateInputClasses = classNames(Classes.INPUT, {
            "pt-intent-danger": !(this.isDateValidAndInRange(startDateValue) || this.isNull(startDateValue) || startDateString === ""),
        });

        const endDateInputClasses = classNames(Classes.INPUT, {
            "pt-intent-danger": !(this.isDateValidAndInRange(endDateValue) || this.isNull(endDateValue) || endDateString === ""),
        });

        const popoverContent = (
            <DateRangePicker
                allowSingleDayRange={this.props.allowSingleDayRange}
                onChange={this.handleDateRangeChange}
                shortcuts={this.props.shortcuts}
                value={this.getCurrentDateRange()}
            />
        );

        return (
            <Popover
                autoFocus={false}
                content={popoverContent}
                enforceFocus={false}
                inline={true}
                isOpen={this.state.isOpen}
                onClose={this.handleClosePopover}
                popoverClassName={"pt-daterangeinput-popover"}
                position={Position.BOTTOM_LEFT}
                // useSmartArrowPositioning={false} // TODO: move the arrow based on which field is focused?
            >
                <div className={Classes.CONTROL_GROUP}>
                    <input
                        className={startDateInputClasses}
                        disabled={this.props.disabled}
                        onBlur={this.handleStartDateInputBlur}
                        onChange={this.handleStartDateInputChange}
                        onClick={this.handleInputClick}
                        onFocus={this.handleStartDateInputFocus}
                        placeholder={startDatePlaceholder}
                        ref={this.setStartDateInputRef}
                        type="text"
                        value={startDateString}
                    />
                    <input
                        className={endDateInputClasses}
                        disabled={this.props.disabled}
                        onBlur={this.handleEndDateInputBlur}
                        onChange={this.handleEndDateInputChange}
                        onClick={this.handleInputClick}
                        onFocus={this.handleEndDateInputFocus}
                        placeholder={endDatePlaceholder}
                        ref={this.setEndDateInputRef}
                        type="text"
                        value={endDateString}
                    />
                </div>
            </Popover>
        );
    }

    private setStartDateInputRef = (el: HTMLElement) => {
        this.startDateInputRef = el;
    }

    private setEndDateInputRef = (el: HTMLElement) => {
        this.endDateInputRef = el;
    }

    private getDefaultDateRange = () => {
        const defaultDateRange = this.props.defaultValue;
        return (defaultDateRange != null)
            ? [this.fromDateToMoment(defaultDateRange[0]), this.fromDateToMoment(defaultDateRange[1])]
            : [moment(null), moment(null)];
    }

    private isDateValidAndInRange(value: moment.Moment) {
        return value != null && value.isValid() && this.dateIsInRange(value);
    }

    private getCurrentDateRange = () => {
        const startDate = this.isDateValidAndInRange(this.state.startDateValue)
                ? this.fromMomentToDate(this.state.startDateValue)
                : null;
        const endDate = this.isDateValidAndInRange(this.state.endDateValue)
                ? this.fromMomentToDate(this.state.endDateValue)
                : null;
        return [startDate, endDate] as DateRange;
    }

    private getDateStringForDisplay = (value: moment.Moment) => {
        if (this.isNull(value)) {
            return "";
        } else if (!value.isValid()) {
            return this.props.invalidDateMessage;
        } else if (!this.dateIsInRange(value)) {
            return this.props.outOfRangeMessage;
        } else {
            return value.format(this.props.format);
        }
    }

    private isNull(value: moment.Moment) {
        return value == null || value.parsingFlags().nullInput;
    }

    private dateIsInRange(value: moment.Moment) {
        return value != null && value.isBetween(this.props.minDate, this.props.maxDate, "day", "[]");
    }

    /**
     * Translate a moment into a Date object, adjusting the moment timezone into the local one.
     * This is a no-op unless moment-timezone's setDefault has been called.
     */
    private fromMomentToDate = (momentDate: moment.Moment) => {
        if (momentDate == null) {
            return undefined;
        } else {
            return new Date(
                momentDate.year(),
                momentDate.month(),
                momentDate.date(),
                momentDate.hours(),
                momentDate.minutes(),
                momentDate.seconds(),
                momentDate.milliseconds(),
            );
        }
    }
    /**
     * Translate a Date object into a moment, adjusting the local timezone into the moment one.
     * This is a no-op unless moment-timezone's setDefault has been called.
     */
    private fromDateToMoment = (date: Date) => {
        if (date == null || typeof date === "string") {
            return moment(date);
        } else {
            return moment([
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                date.getHours(),
                date.getMinutes(),
                date.getSeconds(),
                date.getMilliseconds(),
            ]);
        }
    }
    private handleStartDateInputFocus = () => {
        this.handleGenericInputFocus(this.state.startDateValue, "startDateValueString", "isStartDateInputFocused");
    }

    private handleEndDateInputFocus = () => {
        this.handleGenericInputFocus(this.state.endDateValue, "endDateValueString", "isEndDateInputFocused");
    }

    private handleStartDateInputBlur = () => {
        const valueString = this.state.startDateValueString;
        this.handleGenericInputBlur(valueString, "startDateValue", "startDateValueString", "isStartDateInputFocused");
    }

    private handleEndDateInputBlur = () => {
        const valueString = this.state.endDateValueString;
        this.handleGenericInputBlur(valueString, "endDateValue", "endDateValueString", "isEndDateInputFocused");
    }

    private handleStartDateInputChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const valueString = (e.target as HTMLInputElement).value;
        this.handleGenericInputChange(valueString, "startDateValue", "startDateValueString");
    }

    private handleEndDateInputChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const valueString = (e.target as HTMLInputElement).value;
        this.handleGenericInputChange(valueString, "endDateValue", "endDateValueString");
    }

    private handleGenericInputFocus = (value: moment.Moment, valueStringKey: string, focusStateKey: string) => {
        const valueString = this.isNull(value)
            ? ""
            : value.format(this.props.format);

        if (this.props.openOnFocus) {
            this.setState({ [focusStateKey]: true, [valueStringKey]: valueString, isOpen: true });
        } else {
            this.setState({ [focusStateKey]: true, [valueStringKey]: valueString });
        }
    }

    private handleGenericInputBlur =
        (valueString: string, valueKey: string, valueStringKey: string, focusStatusKey: string) => {

        const value = moment(valueString, this.props.format);

        const isValueInvalid = !value.isValid();
        const isValueOutOfRange = !this.dateIsInRange(value);
        const isValueStringOutOfSync = valueString !== this.getDateStringForDisplay(this.state.startDateValue);

        const isInputEmpty = valueString.length === 0;
        const didInputChangeToInvalidState =
            !isInputEmpty && isValueStringOutOfSync && (isValueInvalid || isValueOutOfRange);

        if (isInputEmpty) {
            this.setState({
                [focusStatusKey]: false,
                [valueKey]: moment(null),
                [valueStringKey]: null,
            });
        } else if (didInputChangeToInvalidState) {
            if (this.props.value === undefined) {
                this.setState({ [focusStatusKey]: false, [valueKey]: value, [valueStringKey]: null });
            } else {
                this.setState({ [focusStatusKey]: false });
            }

            if (isValueInvalid) {
                // TODO: Call onError with an empty date
            } else if (isValueOutOfRange) {
                // TODO: Call onError with value
            } else {
                // TODO: Call onChange with value
            }
        } else {
            this.setState({ [focusStatusKey]: false });
        }
    }

    private handleGenericInputChange = (valueString: string, valueKey: string, valueStringKey: string) => {
        const value = moment(valueString, this.props.format);
        if (valueString.length === 0) {
            this.setState({ [valueKey]: null, [valueStringKey]: "" });
        } else if (value.isValid() && this.dateIsInRange(value)) {
            if (this.props.value === undefined) {
                this.setState({ [valueKey]: value, [valueStringKey]: valueString });
            } else {
                this.setState({ [valueStringKey]: valueString });
            }
            // TODO: Utils.safeInvoke(this.props.onChange, fromMomentToDate(value));
        } else {
            this.setState({ [valueStringKey]: valueString });
        }
    }

    private handleInputClick = (e: React.SyntheticEvent<HTMLInputElement>) => {
        e.stopPropagation();
    }

    private handleClosePopover = () => {
        this.setState({ isOpen: false });
    }

    private handleDateRangeChange = (dateRange: DateRange) => {
        const { format } = this.props;
        const [startDate, endDate] = dateRange;

        const startDateValue = this.fromDateToMoment(startDate);
        const endDateValue = this.fromDateToMoment(endDate);

        const startDateValueString = (startDate) ? startDateValue.format(format) : "";
        const endDateValueString = (endDate) ? endDateValue.format(format) : "";

        this.setState({ startDateValue, endDateValue, startDateValueString, endDateValueString });
    }
}
