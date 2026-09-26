import _ from "lodash";

export const setValue = (object:object,path:string,value:string) => {
    return _.set(object, path, value);
};

export const getValue = (object:object,path:string,defaultValue:any) => {
    return _.get(object, path,defaultValue);
}

export const isEmpty = (object:object) => {
    return _.isEmpty(object);
};