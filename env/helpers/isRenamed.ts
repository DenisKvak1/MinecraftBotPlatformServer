export function isRenamed(string: string){
	try {
		const json = JSON.parse(string)

		if (!Array.isArray(json?.extra)) return false

		let isReturn:boolean = false
		json.extra.forEach((info: any)=>{
			if(!info.text) return isReturn = true
			if(Object.keys(info).length !== 1) {
				return isReturn = true
			}
		})
		if(isReturn) return false


		return true
	} catch (e){
		return false
	}
}