import openmeteo_requests

import pandas as pd
import requests_cache
from retry_requests import retry

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)

# Make sure all required weather variables are listed here
# The order of variables in hourly or daily is important to assign them correctly below
url = "https://api.open-meteo.com/v1/forecast"
params = {
	"latitude": 20.6742,
	"longitude": -101.3475,
	"daily": ["temperature_2m_max", "temperature_2m_min", "shortwave_radiation_sum", "et0_fao_evapotranspiration"],
	"hourly": ["temperature_2m", "shortwave_radiation", "direct_radiation", "diffuse_radiation", "relative_humidity_2m", "vapour_pressure_deficit", "cloud_cover", "wind_speed_10m", "precipitation", "soil_temperature_0cm", "soil_moisture_0_to_1cm"],
}
responses = openmeteo.weather_api(url, params = params)

# Process first location. Add a for-loop for multiple locations or weather models
response = responses[0]
print(f"Coordinates: {response.Latitude()}°N {response.Longitude()}°E")
print(f"Elevation: {response.Elevation()} m asl")
print(f"Timezone difference to GMT+0: {response.UtcOffsetSeconds()}s")

# Process hourly data. The order of variables needs to be the same as requested.
hourly = response.Hourly()
hourly_temperature_2m = hourly.Variables(0).ValuesAsNumpy()
hourly_shortwave_radiation = hourly.Variables(1).ValuesAsNumpy()
hourly_direct_radiation = hourly.Variables(2).ValuesAsNumpy()
hourly_diffuse_radiation = hourly.Variables(3).ValuesAsNumpy()
hourly_relative_humidity_2m = hourly.Variables(4).ValuesAsNumpy()
hourly_vapour_pressure_deficit = hourly.Variables(5).ValuesAsNumpy()
hourly_cloud_cover = hourly.Variables(6).ValuesAsNumpy()
hourly_wind_speed_10m = hourly.Variables(7).ValuesAsNumpy()
hourly_precipitation = hourly.Variables(8).ValuesAsNumpy()
hourly_soil_temperature_0cm = hourly.Variables(9).ValuesAsNumpy()
hourly_soil_moisture_0_to_1cm = hourly.Variables(10).ValuesAsNumpy()

hourly_data = {
	"date": pd.date_range(
		start = pd.to_datetime(hourly.Time(), unit = "s", utc = True),
		end =  pd.to_datetime(hourly.TimeEnd(), unit = "s", utc = True),
		freq = pd.Timedelta(seconds = hourly.Interval()),
		inclusive = "left"
	)
}

hourly_data["temperature_2m"] = hourly_temperature_2m
hourly_data["shortwave_radiation"] = hourly_shortwave_radiation
hourly_data["direct_radiation"] = hourly_direct_radiation
hourly_data["diffuse_radiation"] = hourly_diffuse_radiation
hourly_data["relative_humidity_2m"] = hourly_relative_humidity_2m
hourly_data["vapour_pressure_deficit"] = hourly_vapour_pressure_deficit
hourly_data["cloud_cover"] = hourly_cloud_cover
hourly_data["wind_speed_10m"] = hourly_wind_speed_10m
hourly_data["precipitation"] = hourly_precipitation
hourly_data["soil_temperature_0cm"] = hourly_soil_temperature_0cm
hourly_data["soil_moisture_0_to_1cm"] = hourly_soil_moisture_0_to_1cm

hourly_dataframe = pd.DataFrame(data = hourly_data)
print("\nHourly data\n", hourly_dataframe)

# Process daily data. The order of variables needs to be the same as requested.
daily = response.Daily()
daily_temperature_2m_max = daily.Variables(0).ValuesAsNumpy()
daily_temperature_2m_min = daily.Variables(1).ValuesAsNumpy()
daily_shortwave_radiation_sum = daily.Variables(2).ValuesAsNumpy()
daily_et0_fao_evapotranspiration = daily.Variables(3).ValuesAsNumpy()

daily_data = {
	"date": pd.date_range(
		start = pd.to_datetime(daily.Time(), unit = "s", utc = True),
		end =  pd.to_datetime(daily.TimeEnd(), unit = "s", utc = True),
		freq = pd.Timedelta(seconds = daily.Interval()),
		inclusive = "left"
	)
}

daily_data["temperature_2m_max"] = daily_temperature_2m_max
daily_data["temperature_2m_min"] = daily_temperature_2m_min
daily_data["shortwave_radiation_sum"] = daily_shortwave_radiation_sum
daily_data["et0_fao_evapotranspiration"] = daily_et0_fao_evapotranspiration

daily_dataframe = pd.DataFrame(data = daily_data)
print("\nDaily data\n", daily_dataframe)


hourly_dataframe.to_csv("hourly_output.csv", index=False)
daily_dataframe.to_csv("daily_output.csv", index=False)
print("Datos exportados a CSV exitosamente.")