import qs from 'qs'

export function serializeParams(params)
{
    // Use qs to format the query string, specifying 'repeat' for arrays
    return qs.stringify(params, { arrayFormat: 'repeat' });
}