//————————————————————————全局变量————————————————————
var ConfigData;
var LandFile;
var LandData;
var LandDataNotEmpty;
var RecordFile;
var RecordData;
var RecordDataNotEmpty;
var LandShareFile;
var LandShareData;
var LandShareDataNotEmpty;
var shareModeCase;        //共享状态开关0关闭，1添加共享，2删除共享
var sendSharePlayerInfo;

function onEnable(){
	mc.sendCmdOutput('[破晓] 领地石插件加载完毕! ————by 那个男人');
	const path = './plugins/BlockLand/'; //路径要加. 不然会创建在盘符的根目录
	if (File.exists(path+'Config.json') == false){
		File.mkdir(path);
		mc.sendCmdOutput("配置文件不存在，正在创建配置文件");
		let DefaultData = {
			'领地石ID':57,
			'领地石保护半径':20,
			'主世界是否生效':true,
			'地狱是否生效':false,
			'末地是否生效':false,
			'是否开启Y轴领地':false,
			'OP可操作':true,
			'OP操作日志是否开启':false};
		ConfigData = data.toJson(DefaultData,2); //转换成json格式，缩进两格并自动换行，默认0则为一排
		new JsonConfigFile(path+'Config.json');  //创建领地石配置文件
		File.writeTo(path+'Config.json',ConfigData);//与python领地石不同的是，File.writeTo 这个调用可以直接清零文件再写入
		new JsonConfigFile(path+'Land.json');//创建领地石记录文件
		new JsonConfigFile(path+'Record.json');//创建领地石日志记录文件
		new JsonConfigFile(path+'LandShare.json');//创建领地石分享记录文件
		ConfigFile = path+'Config.json';
		LandFile = path+'Land.json';
		RecordFile = path+'Record.json';
		LandShareFile = path+'LandShare.json';
		LandDataNotEmpty = false;
		RecordDataNotEmpty = false;
		LandShareDataNotEmpty = false;
	}else{
		ConfigData = File.readFrom(path+'Config.json');
		ConfigData = data.parseJson(ConfigData);
		if(File.getFileSize(path+'Land.json') > 2){       //json空文件默认有{},占用两个字符，和py创建的json默认文件不一样
			LandFile = path+'Land.json';
			LandData = File.readFrom(path+'Land.json');
			LandData = data.parseJson(LandData);
			LandDataNotEmpty = true;
		}else{
			LandDataNotEmpty = false;
			LandFile = path+'Land.json';
		}
		if(File.getFileSize(path+'Record.json') > 2){
			RecordFile = path+'Record.json';
			RecordData = File.readFrom(path+'Record.json');
			RecordData = data.parseJson(RecordData);
			RecordDataNotEmpty = true;
		}else{
			RecordDataNotEmpty = false;
			RecordFile = path+'Record.json';
		}
		if(File.getFileSize(path+'LandShare.json') > 2){
			LandShareFile = path+'LandShare.json';
			LandShareData = File.readFrom(path+'LandShare.json');
			LandShareData = data.parseJson(LandShareData);
			LandShareDataNotEmpty = true;
		}else{
			LandShareDataNotEmpty = false;
			LandShareFile = path+'LandShare.json';
		}
	}
	shareModeCase = {};
	sendSharePlayerInfo = {};
}
//====================================控制台指令事件============================================================================================
function onPlayerCMD(Player,getCMD){
	if(getCMD.length < 50){
		if(getCMD == '领地石'){//在js版的插件加载器中，无需/+指令，直接判断指令即可，BDSpy需要/+指令
			let getTriggerPlayer = Player.name;
			let message = '§2领地石帮助列表:\n/领地石 §f添加共享 共享玩家名称\n§2/领地石 §f删除共享 共享玩家名称';
			Player.sendText(message,1);
			return false;//拦截指令才不会提示未知指令
		}
		if(getCMD.indexOf(" ") != -1){//判断指令中是否有空格
			var getCMDArray = getCMD.split(" ");
		}
		if(getCMDArray[0] == '领地石'){
			let getPlayerName = Player.name;
			if(getCMDArray[0] == '/领地石' && getCMDArray[1] != undefined){
				let message = '§2领地石帮助列表:\n/领地石 §f添加共享 共享玩家名称\n§2/领地石 §f删除共享 共享玩家名称\n§2/领地石 §f领地校正';
				Player.sendText(message,1);
				return false;
			}
			if(getCMDArray[1] != '帮助' && getCMDArray[1] != '添加共享' && getCMDArray[1] != '删除共享' && getCMDArray[1] != '领地校正'){
				let message = '§e[领地石]§f错误!请输入正确的指令,如需查看帮助请输入§a/领地石 帮助';
				Player.sendText(message,1);
				return false;
			}
			if(getCMDArray[1] == '帮助'){
				let message = '§2领地石帮助列表:\n/领地石 §f添加共享 共享玩家名称\n§2/领地石 §f删除共享 共享玩家名称';
				Player.sendText(message,1);
				return false;
			}
			if(getCMDArray[1] == '添加共享'){
				if(getCMDArray[2] == undefined){
					let message = '§4[领地石]错误,未定义对象!';
					Player.sendText(message,1);
					return false;
				}
				sendSharePlayerInfo[getPlayerName] = String(getCMDArray[2]);
				let message = '§e[领地石]§f共享开始,请在需要共享的领地上放置任意方块';
				Player.sendText(message,1);
				shareModeCase[getPlayerName] = 1;
				return false;
			}
			if(getCMDArray[1] == '删除共享'){
				if(getCMDArray[2] == undefined){
					let message = '§4[领地石]错误,未定义对象!';
					Player.sendText(message,1);
					return false;
				}
				sendSharePlayerInfo[getPlayerName] = String(getCMDArray[2]);
				let message = '§e[领地石]§f删除开始,请在需要解除共享的领地上放置任意方块!';
				Player.sendText(message,1);		
				shareModeCase[getPlayerName] = 2;
				return false;
			}
			if(getCMDArray[1] == '领地校正'){
				if(Player.isOP() == undefined){
					blockLandIsExists(Player);
					return false;
				}else{
					let message = '§e[领地石]§f该指令只有OP才能使用!';
					Player.sendText(message,1);
					return false;
				}
			}
		}
	}
}
//====================================领地石功能判断函数===============================================================================================
function BlockWorldJudgment(level){
	if(level == 0 && ConfigData['主世界是否生效'] == true){
		return true; 
	}
	if(level == 1 && ConfigData['地狱是否生效'] == true){
		return true;
	}
	if(level == 2 && ConfigData['末地是否生效'] == true){
		return true;
	}
	return false;	
}

function BlockEventJudgment(playerName,blockKey,position,playerInfo){
	if(LandData.hasOwnProperty(blockKey) == true){  //对象中是否存在Key,类似python的字典里的 in
		for(let Key in LandData){ //let表示只在本代码内有效，直接遍历对象LandData，Key为遍历的键
			if(Key == blockKey){
				let Value = LandData[Key];
				if(playerName == Value['所属玩家']){
					return true;
				}else{
					return Value['所属玩家'];
				}
			}
		}
	}else{
		if(ConfigData['是否开启Y轴领地'] == true){
			let BlockX = position['x'];
			let BlockY = position['y'];
			let BlockZ = position['z'];
			let Value;
			for(let Key in LandData){
				Value = LandData[Key];
				if(Number(Value['X1']) < BlockX && BlockX <Number(Value['X2']) && Number(Value['Y1']) < BlockY && BlockY < Number(Value['Y2']) && Number(Value['Z1']) < BlockZ && BlockZ < Number(Value['Z2'])){ //Number 字符串转整数
					if(playerName == Value['所属玩家']){
						ShareInfoAddJudgment(playerName,playerInfo,Key,Value); 
						ShareInfoDelJudgment(playerName,playerInfo,Key,Value);
						return true;
					}else{
						let LandBelongPlayer = Value['所属玩家'];
						return LandBelongPlayer;
					}
				}
			}			
		}else{
			let BlockX = position['x'];
			let BlockZ = position['z'];		//我的世界高度信息在Y轴里
			let Value;
			for(let Key in LandData){
				Value = LandData[Key];
				if(Number(Value['X1']) < BlockX && BlockX < Number(Value['X2']) && Number(Value['Z1']) < BlockZ && BlockZ < Number(Value['Z2'])){
					if(playerName == Value['所属玩家']){
						ShareInfoAddJudgment(playerName,playerInfo,Key,Value);
						ShareInfoDelJudgment(playerName,playerInfo,Key,Value);
						return true;
					}else{
						if(Value['是否共享'] == true){
							if(LandShareData.hasOwnProperty(playerName) == true){
								return true;
							}
						}							
						let LandBelongPlayer = Value['所属玩家'];
						return LandBelongPlayer;
					}
				}
			}
		}
	}
	return true;
}

function ShareInfoAddJudgment(playerName,playerInfo,Key,Value){
	if(shareModeCase.hasOwnProperty(playerName) == true){
		if(shareModeCase[playerName] == 1 && sendSharePlayerInfo[playerName] != undefined){
			if(LandShareDataNotEmpty == false){
				let sendSharePlayerInfoPlayerName = sendSharePlayerInfo[playerName];
				let Temp = {sendSharePlayerInfoPlayerName:true};
				LandShareData = {Key:Temp};
				LandShareData = data.toJson(LandShareData,2);//先转换为json
				File.writeTo(LandShareFile,LandShareData);
				LandShareData = data.parseJson(LandShareData);//写入完成后再转换为对象
				LandShareDataNotEmpty = true;
				Temp = LandData[Key];
				Temp['是否共享'] = true;
				LandData[Key] = Temp;
				LandData = data.toJson(LandData,2);
				File.writeTo(LandFile,LandData);
				LandData = data.parseJson(LandData);
				let message = '§e[领地石]§f共享成功!';
				playerInfo.sendText(message,1);
				shareModeCase[playerName] = 0;
			}else{
				if(LandShareData.hasOwnProperty(Key) == true){
					let Temp = LandShareData[Key];
					let Temp2 = sendSharePlayerInfo[playerName];
					Temp[Temp2] = true;
					LandShareData[Key] = Temp;
				}else{
					let sendSharePlayerInfoPlayerName = sendSharePlayerInfo[playerName];
					LandShareData[Key] = {sendSharePlayerInfoPlayerName:true};
					let Temp = LandData[Key];
					Temp['是否共享'] = true;
					LandData[Key] = Temp;
					LandData = data.toJson(LandData,2);
					File.writeTo(LandFile,LandData);
					LandData = data.parseJson(LandData);
				}
				LandShareData = data.toJson(LandShareData,2);
				File.writeTo(LandShareFile,LandShareData);
				LandShareData = data.parseJson(LandShareData);
				let message = '§e[领地石]§f共享成功!';
				playerInfo.sendText(message,1);
				shareModeCase[playerName] = 0;
			}
		}else{
			shareModeCase[playerName] = 0;
		}
	}
}

function ShareInfoDelJudgment(playerName,playerInfo,Key,Value){
	if(shareModeCase.hasOwnProperty(playerName) == true){
		if(shareModeCase[playerName] == 2 && sendSharePlayerInfo[playerName] != undefined){
			if(LandShareDataNotEmpty == false){
				let message = '§e[领地石]§4错误删除!没有信息！';
				playerInfo.sendText(message,1);
				shareModeCase[playerName] = 0;
			}else{
				if(LandShareData.hasOwnProperty(Key) == true){
					if(LandShareData[Key].hasOwnProperty(sendSharePlayerInfo[playerName]) == true){
						let Temp = LandShareData[Key];
						let Temp2 = sendSharePlayerInfo[playerName];
						delete Temp[Temp2];
						LandShareData[Key] = Temp;
						if(LandShareData[Key] != undefined){
							delete LandShareData[Key];
						}
						LandShareData = data.toJson(LandShareData,2);
						File.writeTo(LandShareFile,LandShareData);
						LandShareData = data.parseJson(LandShareData);
						let message = '§e[领地石]§a此领地与玩家'+'§f'+sendSharePlayerInfo[playerName]+'§a解除共享成功！';
						playerInfo.sendText(message,1);
						shareModeCase[playerName] = 0;
					}else{
						let message = '§e[领地石]§4错误删除!这个领地没有这个玩家的信息！';
						playerInfo.sendText(message,1);
						shareModeCase[playerName] = 0;
					}
				}else{
					let message = '§e[领地石]§4错误删除!这个领地没有任何共享玩家！';
					playerInfo.sendText(message,1);
					shareModeCase[playerName] = 0;
				}
			}
		}
	}
}

function blockLandIsExists(playerInfo){
	let getWorld = playerInfo.pos['dimid'];
	let position = playerInfo.pos;
	if(BlockWorldJudgment(getWorld) == true){
		if(ConfigData['是否开启Y轴领地'] == true){
			let BlockX = position['x'];
			let BlockY = position['y'];
			let BlockZ = position['z'];
			let Value;
			for(let Key in LandData){
				Value = LandData[Key];
				if(Number(Value['X1']) < BlockX && BlockX <Number(Value['X2']) && Number(Value['Y1']) < BlockY && BlockY < Number(Value['Y2']) && Number(Value['Z1']) < BlockZ && BlockZ < Number(Value['Z2'])){
					let KeyArray = Key.split('.');
					let LandX = Number(KeyArray[0]);
					let LandY = Number(KeyArray[1]);
					let LandZ = Number(KeyArray[2]);
					let getBlockInfo = mc.getBlock(LandX,LandY,LandZ,Number(getWorld));
					if(getBlockInfo == null){
						delete LandData[Key];
						let message = '§e[领地石]§a修正完毕,该领地中央没有领地石,领地已经删除';
						playerInfo.sendText(message,1);
						LandData = data.toJson(LandData,2);
						File.writeTo(LandFile,LandData);
						LandData = data.parseJson(LandData);
						return;
					}
					if(getBlockInfo['id'] != ConfigData['领地石ID']){
						delete LandData[Key];
						let message = '§e[领地石]§a修正完毕,该领地中央没有领地石,领地已经删除';
						playerInfo.sendText(message,1);
						LandData = data.toJson(LandData,2);
						File.writeTo(LandFile,LandData);
						LandData = data.parseJson(LandData);
						return;
					}
					let message = '§e[领地石]§a检测完毕,该领地中央存在领地石没有异常';
					playerInfo.sendText(message,1);
					return;
				}
			}			
		}else{
			let BlockX = position['x'];
			let BlockZ = position['z'];
			let Value;
			for(let Key in LandData){
				Value = LandData[Key];
				if(Number(Value['X1']) < BlockX && BlockX < Number(Value['X2']) && Number(Value['Z1']) < BlockZ && BlockZ < Number(Value['Z2'])){
					let KeyArray = Key.split('.');
					let LandX = Number(KeyArray[0]);
					let LandY = Number(KeyArray[1]);
					let LandZ = Number(KeyArray[2]);
					let getBlockInfo = mc.getBlock(LandX,LandY,LandZ,Number(getWorld));
					if(getBlockInfo == null || getBlockInfo['id'] != ConfigData['领地石ID']){
						delete LandData[Key];
						let message = '§e[领地石]§a修正完毕,该领地中央没有领地石,领地已经删除';
						playerInfo.sendText(message,1);
						LandData = data.toJson(LandData,2);
						File.writeTo(LandFile,LandData);
						LandData = data.parseJson(LandData);
						return;						
					}
					let message = '§e[领地石]§a检测完毕,该领地中央存在领地石没有异常';
					playerInfo.sendText(message,1);
					return;
				}
			}
			let message = '§e[领地石]§4错误!§f附近不存在生成的领地';
			playerInfo.sendText(message,1);
		}
	}
}
//===================================领地石功能函数==================================================================================================
function onBlockPlace(player,block){
	let getTriggerPlayer = player;
	let getBlockName = block.name;
	let getBlockID = block.id;
	let getBlockPosition = block.pos;
	let BlockX1 = getBlockPosition['x'] - Number(ConfigData['领地石保护半径']);
	let BlockX2 = getBlockPosition['x'] + Number(ConfigData['领地石保护半径']);
	let BlockY1 = getBlockPosition['y'] - Number(ConfigData['领地石保护半径']);
	let BlockY2 = getBlockPosition['y'] + Number(ConfigData['领地石保护半径']);
	let BlockZ1 = getBlockPosition['z'] - Number(ConfigData['领地石保护半径']);
	let BlockZ2 = getBlockPosition['z'] + Number(ConfigData['领地石保护半径']);
	let getWorld = getTriggerPlayer.pos['dimid'];
	let getPlayerName = getTriggerPlayer.name;
	if(BlockWorldJudgment(getWorld) == true){
		var BlockKey = getBlockPosition['x']+'.'+getBlockPosition['y']+'.'+getBlockPosition['z'];
		if(getWorld == 0){
			var levelName = 'world';
		}
		if(getWorld == 1){
			var levelName = 'nether';
		}
		if(getWorld == 2){
			var levelName = 'ender';
		}
		let BlockInfo = {
			'X1':BlockX1,
			'X2':BlockX2,
			'Y1':BlockY1,
			'Y2':BlockY2,
			'Z1':BlockZ1,
			'Z2':BlockZ2,
			'所属世界':levelName,
			'所属玩家':getPlayerName,
			'是否共享':false
		};
		if(LandDataNotEmpty == false){
			if(getBlockID == ConfigData['领地石ID']){
				LandData = {BlockKey:BlockInfo};
				LandData = data.toJson(LandData,2);
				File.writeTo(LandFile,LandData);
				LandData = data.parseJson(LandData);
				LandDataNotEmpty = true;
				let message = '§e领地石已上线,领地保护系统启动!';
				getTriggerPlayer.sendText(message,1);
			}
		}else{
			let FunctionReturnValue = BlockEventJudgment(getPlayerName,BlockKey,getBlockPosition,getTriggerPlayer);
			if(FunctionReturnValue == true || getTriggerPlayer.isOP()){
				if(getBlockID == ConfigData['领地石ID']){
					LandData[BlockKey] = BlockInfo;
					LandData = data.toJson(LandData,2);
					File.writeTo(LandFile,LandData);
					LandData = data.parseJson(LandData);
					let message = '§e[领地石]§a领地已上线,保护系统启动!';
					getTriggerPlayer.sendText(message,1);
				}
			}else{
				let message = '§e[领地石]§4此处为'+FunctionReturnValue+'的领地,不可放置!';
				getTriggerPlayer.sendText(message,1);
				return false;
			}
		}
	}
}

function onBlockBreak(player,block){
	let getTriggerPlayer = player;
	let getBlockName = block.name;
	let getBlockID = block.id;
	let getBlockPosition = block.pos;
	let BlockX1 = getBlockPosition['x'] - Number(ConfigData['领地石保护半径']);
	let BlockX2 = getBlockPosition['x'] + Number(ConfigData['领地石保护半径']);
	let BlockY1 = getBlockPosition['y'] - Number(ConfigData['领地石保护半径']);
	let BlockY2 = getBlockPosition['y'] + Number(ConfigData['领地石保护半径']);
	let BlockZ1 = getBlockPosition['z'] - Number(ConfigData['领地石保护半径']);
	let BlockZ2 = getBlockPosition['z'] + Number(ConfigData['领地石保护半径']);
	let getWorld = getTriggerPlayer.pos['dimid'];
	let getPlayerName = getTriggerPlayer.name;
	if(BlockWorldJudgment(getWorld) == true){
		var BlockKey = getBlockPosition['x']+'.'+getBlockPosition['y']+'.'+getBlockPosition['z'];
		if(getWorld == 0){
			var levelName = 'world';
		}
		if(getWorld == 1){
			var levelName = 'nether';
		}
		if(getWorld == 2){
			var levelName = 'ender';
		}
		if(LandDataNotEmpty == true){
			let FunctionReturnValue = BlockEventJudgment(getPlayerName,BlockKey,getBlockPosition,getTriggerPlayer);
			if(FunctionReturnValue == true || getTriggerPlayer.isOP()){
				if(getBlockID == ConfigData['领地石ID']){
					delete LandData[BlockKey];
					LandData = data.toJson(LandData,2);
					File.writeTo(LandFile,LandData);
					LandData = data.parseJson(LandData);
					let message = '§e[领地石]§a领地石已经拆除,保护系统关闭!';
					getTriggerPlayer.sendText(message,1);
				}
			}else{
				let message = '§e[领地石]§4此处为'+FunctionReturnValue+'的领地,不可破坏!';
				getTriggerPlayer.sendText(message,1);
				return false;
			}
		}
	}

}

function onOpenChest(player,block){
	let getTriggerPlayer = player;
	let getChestPosition = block.pos;
	let getWorld = getTriggerPlayer.pos['dimid'];
	let getPlayerName = getTriggerPlayer.name;
	if(BlockWorldJudgment(getWorld) == true){
		if(LandDataNotEmpty == true){
			let BlockKey = String(getChestPosition['x'])+'.'+String(getChestPosition['y'])+'.'+String(getChestPosition['z']);
			let FunctionReturnValue = BlockEventJudgment(getPlayerName,BlockKey,getChestPosition,getTriggerPlayer);
			if(FunctionReturnValue == true || getTriggerPlayer.isOP() == 1){
				return true;
			}else{
				let message = '§e[领地石]§4此处为'+FunctionReturnValue+'的领地,不可开启这个箱子!';
				getTriggerPlayer.sendText(message,1);
				return false;
			}
		}
	}	
}

function onUseItems(player,item,block,side){
	let getTriggerPlayer = player;
	let getBlockPosition = player.blockPos;
	let getWorld = getTriggerPlayer.pos['dimid'];
	let getPlayerName = getTriggerPlayer.name;
	let getItemName = item.type;
	if(BlockWorldJudgment(getWorld) == true){
		if(getItemName == 'minecraft:water_bucket' || getItemName == 'minecraft:lava_bucket' || getItemName == 'minecraft:flint_and_steel' || getItemName == 'minecraft:fire_charge'){
			if(LandDataNotEmpty == true){
				let BlockKey = String(getBlockPosition['x'])+'.'+String(getBlockPosition['y'])+'.'+String(getBlockPosition['z']);
				let FunctionReturnValue = BlockEventJudgment(getPlayerName,BlockKey,getBlockPosition,getTriggerPlayer);
				if(FunctionReturnValue == true || getTriggerPlayer.isOP() == 1){
					return true;
				}else{
					let message = '§e[领地石]§4此处为'+FunctionReturnValue+'的领地,不可以使用这个物品!';
					getTriggerPlayer.sendText(message,1);
					return false;
				}
			}
		}
	}
}

function onExplode(source,pos,radius,maxResistance,isDestroy,isFire){
	let getExplodePosition = source.blockPos;
	let getWorld = pos.dimid;
	if(BlockWorldJudgment(getWorld) == true){
		if(LandDataNotEmpty == true){
			let BlockKey = String(getExplodePosition['x'])+'.'+String(getExplodePosition['y'])+'.'+String(getExplodePosition['z']);
			let FunctionReturnValue = BlockEventJudgment(null,BlockKey,getExplodePosition,source);
			if(FunctionReturnValue != true){
				return false;
			}

		}
	}
}

function OnFieldBreak(eventPosition,entity){
	let getTriggerEntity = entity;	
	let getWorld = eventPosition.dimid;
	let getBlockPosition = eventPosition;
	let getTriggerEntityName = entity.name;
	if(BlockWorldJudgment(getWorld) == true){
		if(LandDataNotEmpty == true){
			let BlockKey = String(getBlockPosition['x'])+'.'+String(getBlockPosition['y'])+'.'+String(getBlockPosition['z']);
			let FunctionReturnValue = BlockEventJudgment(getTriggerEntityName,BlockKey,getBlockPosition,getTriggerEntity);
			if(FunctionReturnValue != true){
				return false;
			}
		}
	}
}

function Null(){}

onEnable();
mc.listen("onPlayerCmd",onPlayerCMD);
mc.listen("onPlaceBlock",onBlockPlace);
mc.listen("onDestroyBlock",onBlockBreak);
mc.listen("onOpenContainer",onOpenChest);
mc.listen("onUseItemOn",onUseItems);
mc.listen("onEntityExplode",onExplode);
mc.listen("onFarmLandDecay",OnFieldBreak);
mc.regPlayerCmd("领地石","领地石相关功能帮助",Null);