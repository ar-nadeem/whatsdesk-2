
const environment = "PROD";
interface EnvironmentConfig{
	name: string
	runEnv: "PROD" | "BETA"
}
export function getEnvironment(): EnvironmentConfig{
	if(environment == "PROD"){
		return {
			name:"WhatsDesk",
			runEnv:"PROD",
		}
	}else{
		return {
			name:"WhatsDesk BETA",
			runEnv:"BETA",
		}
	}
}