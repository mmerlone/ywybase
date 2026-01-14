/**
 * Flash Message Shared Constants
 *
 * Single source of truth for flash message configuration.
 * Can be imported by both client and server modules.
 */

/**
 * Name of the cookie used to store flash messages.
 * @constant
 */
export const FLASH_COOKIE_NAME = 'flash_message'

/**
 * Maximum age of the flash message cookie in seconds.
 * Set to 60 seconds (1 minute) which is sufficient for redirects
 * while preventing stale messages from lingering.
 * @constant
 */
export const FLASH_COOKIE_MAX_AGE = 60 // 1 minute - enough for redirect
